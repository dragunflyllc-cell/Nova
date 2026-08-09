using System;
using System.Collections.Generic;
using System.Text;
using System.Threading.Tasks;
using ArTacticalTrainer.Domain;
using ArTacticalTrainer.Networking;
using Newtonsoft.Json;
using UnityEngine;
using UnityEngine.Networking;

namespace ArTacticalTrainer.Stats
{
    /// <summary>
    /// Local shot log for one session. Records reaction time (since the
    /// target's most recent transition into Hostile) and split time (since
    /// this operator's previous shot in the session), buffers every shot,
    /// and can flush the buffer to POST /shots/bulk — the REST fallback for
    /// when the live WebSocket relay (Networking/TrainerLinkClient.cs,
    /// the primary path) isn't reachable from the range.
    /// </summary>
    public class StatsTracker : MonoBehaviour
    {
        private readonly List<ShotEventDto> buffer = new();
        private readonly Dictionary<string, long> targetBecameHostileAtMs = new();
        private long? lastShotAtMs;
        private string sessionId;

        public IReadOnlyList<ShotEventDto> Buffer => buffer;

        public void BeginSession(string forSessionId)
        {
            sessionId = forSessionId;
            buffer.Clear();
            targetBecameHostileAtMs.Clear();
            lastShotAtMs = null;
        }

        public void NotifyTargetStateChanged(string targetPlacementId, TargetRuntimeState state)
        {
            if (state == TargetRuntimeState.Hostile)
            {
                targetBecameHostileAtMs[targetPlacementId] = NowMs();
            }
        }

        public ShotEventDto RecordShot(string targetPlacementId, bool hit, HitZone? zone)
        {
            long now = NowMs();
            int? reaction = null;
            if (targetPlacementId != null && targetBecameHostileAtMs.TryGetValue(targetPlacementId, out var becameHostileAt))
            {
                reaction = (int)(now - becameHostileAt);
            }
            int? split = lastShotAtMs.HasValue ? (int)(now - lastShotAtMs.Value) : null;
            lastShotAtMs = now;

            var shot = new ShotEventDto
            {
                Id = Guid.NewGuid().ToString(),
                SessionId = sessionId,
                TargetPlacementId = targetPlacementId,
                TimestampMs = now,
                Hit = hit,
                HitZone = zone,
                ReactionTimeMs = reaction,
                SplitTimeMs = split,
            };
            buffer.Add(shot);
            return shot;
        }

        public async Task<bool> FlushToServerAsync()
        {
            if (buffer.Count == 0) return true;
            var apiBaseUrl = NetworkConfig.Instance != null ? NetworkConfig.Instance.ApiBaseUrl : "http://localhost:4100";
            var json = JsonConvert.SerializeObject(buffer, JsonSettings.Default);
            using var request = new UnityWebRequest($"{apiBaseUrl}/shots/bulk", "POST");
            request.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(json));
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");

            var op = request.SendWebRequest();
            while (!op.isDone) await Task.Yield();

            if (request.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError($"StatsTracker: flush failed: {request.error}");
                return false;
            }
            buffer.Clear();
            return true;
        }

        private static long NowMs() => DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
    }
}
