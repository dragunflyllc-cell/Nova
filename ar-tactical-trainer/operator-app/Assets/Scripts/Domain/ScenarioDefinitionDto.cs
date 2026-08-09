using System.Collections.Generic;
using Newtonsoft.Json;

namespace ArTacticalTrainer.Domain
{
    /// <summary>Mirrors packages/shared-types/src/scenario.ts ScenarioDefinition.</summary>
    [System.Serializable]
    public class ScenarioDefinitionDto
    {
        [JsonProperty("id")] public string Id;
        [JsonProperty("orgId")] public string OrgId;
        [JsonProperty("name")] public string Name;
        [JsonProperty("facilityId")] public string FacilityId;
        [JsonProperty("targets")] public List<TargetPlacementDto> Targets = new();
        [JsonProperty("passFailRules")] public List<PassFailRuleDto> PassFailRules = new();
        [JsonProperty("createdBy")] public string CreatedBy;
        [JsonProperty("createdAt")] public string CreatedAt;
    }

    /// <summary>Mirrors packages/shared-types/src/target.ts TargetDefinition (catalog entry).</summary>
    [System.Serializable]
    public class TargetDefinitionDto
    {
        [JsonProperty("id")] public string Id;
        [JsonProperty("name")] public string Name;

        [JsonProperty("kind")]
        [JsonConverter(typeof(Newtonsoft.Json.Converters.StringEnumConverter))]
        public TargetKind Kind;

        [JsonProperty("modelRef")] public string ModelRef;
        [JsonProperty("defaultAppearance")] public TargetAppearanceOverrideDto DefaultAppearance;
    }
}
