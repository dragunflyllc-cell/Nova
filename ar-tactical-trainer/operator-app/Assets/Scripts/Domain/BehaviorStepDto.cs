using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace ArTacticalTrainer.Domain
{
    [System.Serializable]
    public class BehaviorStepDto
    {
        [JsonProperty("atMs")] public int AtMs;

        [JsonProperty("setState")]
        [JsonConverter(typeof(StringEnumConverter))]
        public TargetRuntimeState SetState;
    }
}
