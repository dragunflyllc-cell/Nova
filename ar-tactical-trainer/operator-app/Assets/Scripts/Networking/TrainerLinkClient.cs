using System;
using System.Collections.Concurrent;
using System.Net.WebSockets;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using ArTacticalTrainer.Domain;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using UnityEngine;

namespace ArTacticalTrainer.Networking
{
    /// <summary>
    /// WebSocket client for the trainer&lt;-&gt;operator relay
    /// (server/src/ws/relay.ts, packages/shared-types/src/ws-protocol.ts).
    /// Joins as role "operator" for a given session and exposes one C#
    /// event per trainer-issued command, plus Send* methods for the
    /// messages this app originates. Uses .NET's ClientWebSocket directly —
    /// supported on IL2CPP for iOS/Android with no extra native plugin.
    ///
    /// Received messages are dispatched on Unity's main thread (queued from
    /// the background receive loop, drained in Update) since subscribers
    /// commonly touch GameObjects.
    /// </summary>
    public class TrainerLinkClient : MonoBehaviour
    {
        public event Action<string> OnSpawnTarget;
        public event Action<string> OnDespawnTarget;
        public event Action<string, TargetRuntimeState> OnSetTargetState;
        public event Action<string> OnStartScenario;
        public event Action OnEndScenario;
        public event Action OnConnected;
        public event Action OnDisconnected;

        private ClientWebSocket socket;
        private string sessionId;
        private CancellationTokenSource cts;
        private readonly ConcurrentQueue<Action> mainThreadQueue = new();

        public bool IsConnected => socket is { State: WebSocketState.Open };

        public async void Connect(string forSessionId)
        {
            sessionId = forSessionId;
            cts = new CancellationTokenSource();
            socket = new ClientWebSocket();

            var wsUrl = NetworkConfig.Instance != null ? NetworkConfig.Instance.WsUrl : "ws://localhost:4100/ws";
            try
            {
                await socket.ConnectAsync(new Uri(wsUrl), cts.Token);
                await SendRaw(new JObject
                {
                    ["type"] = "JOIN",
                    ["sessionId"] = sessionId,
                    ["role"] = "operator",
                });
                mainThreadQueue.Enqueue(() => OnConnected?.Invoke());
                _ = ReceiveLoop();
            }
            catch (Exception e)
            {
                Debug.LogError($"TrainerLinkClient: failed to connect to {wsUrl}: {e.Message}");
            }
        }

        public async void Disconnect()
        {
            cts?.Cancel();
            if (socket is { State: WebSocketState.Open })
            {
                await socket.CloseAsync(WebSocketCloseStatus.NormalClosure, "done", CancellationToken.None);
            }
        }

        private async Task ReceiveLoop()
        {
            var buffer = new byte[8192];
            try
            {
                while (socket.State == WebSocketState.Open && !cts.IsCancellationRequested)
                {
                    using var ms = new System.IO.MemoryStream();
                    WebSocketReceiveResult result;
                    do
                    {
                        result = await socket.ReceiveAsync(new ArraySegment<byte>(buffer), cts.Token);
                        if (result.MessageType == WebSocketMessageType.Close) return;
                        ms.Write(buffer, 0, result.Count);
                    } while (!result.EndOfMessage);

                    string json = Encoding.UTF8.GetString(ms.ToArray());
                    HandleIncoming(json);
                }
            }
            catch (OperationCanceledException)
            {
                // expected on Disconnect()
            }
            catch (Exception e)
            {
                Debug.LogError($"TrainerLinkClient: receive loop error: {e.Message}");
            }
            finally
            {
                mainThreadQueue.Enqueue(() => OnDisconnected?.Invoke());
            }
        }

        private void HandleIncoming(string json)
        {
            JObject obj;
            try
            {
                obj = JObject.Parse(json);
            }
            catch (JsonException)
            {
                return;
            }

            string type = obj["type"]?.ToString();
            var payload = obj["payload"] as JObject;
            if (type == null || payload == null) return;

            switch (type)
            {
                case WsMessageType.SpawnTarget:
                    var spawnId = payload["targetPlacementId"]?.ToString();
                    mainThreadQueue.Enqueue(() => OnSpawnTarget?.Invoke(spawnId));
                    break;
                case WsMessageType.DespawnTarget:
                    var despawnId = payload["targetPlacementId"]?.ToString();
                    mainThreadQueue.Enqueue(() => OnDespawnTarget?.Invoke(despawnId));
                    break;
                case WsMessageType.SetTargetState:
                    var setState = payload.ToObject<SetTargetStatePayload>();
                    mainThreadQueue.Enqueue(() => OnSetTargetState?.Invoke(setState.TargetPlacementId, setState.State));
                    break;
                case WsMessageType.StartScenario:
                    var scenarioId = payload["scenarioId"]?.ToString();
                    mainThreadQueue.Enqueue(() => OnStartScenario?.Invoke(scenarioId));
                    break;
                case WsMessageType.EndScenario:
                    mainThreadQueue.Enqueue(() => OnEndScenario?.Invoke());
                    break;
            }
        }

        public void SendTelemetry(Vector3 position, float headingYDeg)
        {
            var payload = new TelemetryPayload { OperatorPosition = Vec3Dto.FromVector3(position), HeadingYDeg = headingYDeg };
            _ = SendEnvelope(WsMessageType.Telemetry, JObject.FromObject(payload, Serializer));
        }

        public void SendShotEvent(ShotEventDto shot)
        {
            _ = SendEnvelope(WsMessageType.ShotEvent, JObject.FromObject(shot, Serializer));
        }

        public void SendTargetStateChanged(string targetPlacementId, TargetRuntimeState state)
        {
            var payload = new SetTargetStatePayload { TargetPlacementId = targetPlacementId, State = state };
            _ = SendEnvelope(WsMessageType.TargetStateChanged, JObject.FromObject(payload, Serializer));
        }

        public void SendSessionStarted(string operatorId, string scenarioId)
        {
            var payload = new SessionStartedPayload { OperatorId = operatorId, ScenarioId = scenarioId };
            _ = SendEnvelope(WsMessageType.SessionStarted, JObject.FromObject(payload, Serializer));
        }

        public void SendSessionEnded(string outcome)
        {
            var payload = new SessionEndedPayload { Outcome = outcome };
            _ = SendEnvelope(WsMessageType.SessionEnded, JObject.FromObject(payload, Serializer));
        }

        private static readonly JsonSerializer Serializer = JsonSerializer.Create(JsonSettings.Default);

        private Task SendEnvelope(string type, JObject payload)
        {
            var envelope = new JObject
            {
                ["type"] = type,
                ["sessionId"] = sessionId,
                ["ts"] = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds(),
                ["payload"] = payload,
            };
            return SendRaw(envelope);
        }

        private async Task SendRaw(JObject obj)
        {
            if (socket is not { State: WebSocketState.Open }) return;
            var bytes = Encoding.UTF8.GetBytes(obj.ToString(Formatting.None));
            await socket.SendAsync(new ArraySegment<byte>(bytes), WebSocketMessageType.Text, true, cts.Token);
        }

        private void Update()
        {
            while (mainThreadQueue.TryDequeue(out var action))
            {
                action();
            }
        }

        private void OnDestroy()
        {
            Disconnect();
        }
    }
}
