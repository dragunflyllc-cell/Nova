using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace ArTacticalTrainer.Domain
{
    [System.Serializable]
    public class PassFailRuleDto
    {
        [JsonProperty("description")] public string Description;

        [JsonProperty("kind")]
        [JsonConverter(typeof(StringEnumConverter))]
        public PassFailRuleKind Kind;

        [JsonProperty("value")] public float? Value;
    }
}
