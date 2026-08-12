using System.Collections.Generic;
using Newtonsoft.Json;

namespace ArTacticalTrainer.Domain
{
    [System.Serializable]
    public class TargetAppearanceOverrideDto
    {
        [JsonProperty("skinVariant")] public string SkinVariant;
        [JsonProperty("outfitVariant")] public string OutfitVariant;
        [JsonProperty("weaponVariant")] public string WeaponVariant;
    }

    [System.Serializable]
    public class TargetPlacementDto
    {
        [JsonProperty("id")] public string Id;
        [JsonProperty("scenarioId")] public string ScenarioId;
        [JsonProperty("targetDefinitionId")] public string TargetDefinitionId;
        [JsonProperty("anchor")] public SpatialAnchorDto Anchor;
        [JsonProperty("appearanceOverride")] public TargetAppearanceOverrideDto AppearanceOverride;
        [JsonProperty("behaviorScript")] public List<BehaviorStepDto> BehaviorScript = new();
    }
}
