using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace ArTacticalTrainer.Domain
{
    /// <summary>
    /// Payload shapes for packages/shared-types/src/ws-protocol.ts. The
    /// envelope itself ({type, sessionId, ts, payload}) is built/parsed in
    /// Networking/TrainerLinkClient.cs via JObject rather than a generic
    /// envelope type, since Newtonsoft can't discriminate a C# generic by a
    /// runtime "type" string the way the TS union does.
    /// </summary>
    public static class WsMessageType
    {
        public const string SpawnTarget = "SPAWN_TARGET";
        public const string DespawnTarget = "DESPAWN_TARGET";
        public const string SetTargetState = "SET_TARGET_STATE";
        public const string StartScenario = "START_SCENARIO";
        public const string EndScenario = "END_SCENARIO";

        public const string Telemetry = "TELEMETRY";
        public const string ShotEvent = "SHOT_EVENT";
        public const string TargetStateChanged = "TARGET_STATE_CHANGED";
        public const string SessionStarted = "SESSION_STARTED";
        public const string SessionEnded = "SESSION_ENDED";
    }

    [System.Serializable]
    public class SetTargetStatePayload
    {
        [JsonProperty("targetPlacementId")] public string TargetPlacementId;

        [JsonProperty("state")]
        [JsonConverter(typeof(StringEnumConverter))]
        public TargetRuntimeState State;
    }

    [System.Serializable]
    public class StartScenarioPayload
    {
        [JsonProperty("scenarioId")] public string ScenarioId;
    }

    [System.Serializable]
    public class TelemetryPayload
    {
        [JsonProperty("operatorPosition")] public Vec3Dto OperatorPosition;
        [JsonProperty("headingYDeg")] public float HeadingYDeg;
    }

    [System.Serializable]
    public class SessionStartedPayload
    {
        [JsonProperty("operatorId")] public string OperatorId;
        [JsonProperty("scenarioId")] public string ScenarioId;
    }

    [System.Serializable]
    public class SessionEndedPayload
    {
        // "pass" | "fail" | "aborted" — kept as a raw string since it's a
        // narrower subset of SessionOutcome and only ever operator-authored.
        [JsonProperty("outcome")] public string Outcome;
    }
}
