using System.Runtime.Serialization;

namespace ArTacticalTrainer.Domain
{
    /// <summary>
    /// Mirrors packages/shared-types/src/target.ts — kept in lockstep by
    /// hand since this is a separate language/runtime from the TS server.
    /// [EnumMember] values are what actually goes over the wire; keep them
    /// exactly matching the TS union string literals.
    /// </summary>
    public enum TargetKind
    {
        [EnumMember(Value = "hostile")] Hostile,
        [EnumMember(Value = "hostage")] Hostage,
        [EnumMember(Value = "nonThreat")] NonThreat,
    }

    public enum HitZone
    {
        [EnumMember(Value = "head")] Head,
        [EnumMember(Value = "chest")] Chest,
        [EnumMember(Value = "limb")] Limb,
    }

    public enum TargetRuntimeState
    {
        [EnumMember(Value = "idle")] Idle,
        [EnumMember(Value = "hostile")] Hostile,
        [EnumMember(Value = "compliant")] Compliant,
        [EnumMember(Value = "neutralized")] Neutralized,
        [EnumMember(Value = "noShootHostage")] NoShootHostage,
    }

    public enum PassFailRuleKind
    {
        [EnumMember(Value = "allHostilesNeutralized")] AllHostilesNeutralized,
        [EnumMember(Value = "noHostageHits")] NoHostageHits,
        [EnumMember(Value = "underTimeLimitMs")] UnderTimeLimitMs,
        [EnumMember(Value = "minAccuracyPct")] MinAccuracyPct,
    }

    public enum SessionOutcome
    {
        [EnumMember(Value = "pass")] Pass,
        [EnumMember(Value = "fail")] Fail,
        [EnumMember(Value = "aborted")] Aborted,
        [EnumMember(Value = "inProgress")] InProgress,
    }

    public enum MediaKind
    {
        [EnumMember(Value = "video")] Video,
        [EnumMember(Value = "photo")] Photo,
    }
}
