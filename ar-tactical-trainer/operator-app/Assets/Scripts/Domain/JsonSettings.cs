using Newtonsoft.Json;

namespace ArTacticalTrainer.Domain
{
    public static class JsonSettings
    {
        public static readonly JsonSerializerSettings Default = new()
        {
            NullValueHandling = NullValueHandling.Ignore,
        };
    }
}
