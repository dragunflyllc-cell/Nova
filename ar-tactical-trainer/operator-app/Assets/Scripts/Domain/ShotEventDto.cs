using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace ArTacticalTrainer.Domain
{
    /// <summary>
    /// Mirrors packages/shared-types/src/session.ts ShotEvent.
    /// <see cref="TimestampMs"/> is absolute epoch-ms (matches
    /// MediaAsset.timestampMs so after-action review can line footage and
    /// shots up on one timeline) — use DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().
    /// </summary>
    [System.Serializable]
    public class ShotEventDto
    {
        [JsonProperty("id")] public string Id;
        [JsonProperty("sessionId")] public string SessionId;
        [JsonProperty("targetPlacementId")] public string TargetPlacementId;
        [JsonProperty("timestampMs")] public long TimestampMs;
        [JsonProperty("hit")] public bool Hit;

        [JsonProperty("hitZone", NullValueHandling = NullValueHandling.Include)]
        [JsonConverter(typeof(StringEnumConverter))]
        public HitZone? HitZone;

        [JsonProperty("reactionTimeMs")] public int? ReactionTimeMs;
        [JsonProperty("splitTimeMs")] public int? SplitTimeMs;
    }

    [System.Serializable]
    public class MediaAssetDto
    {
        [JsonProperty("id")] public string Id;
        [JsonProperty("sessionId")] public string SessionId;

        [JsonProperty("kind")]
        [JsonConverter(typeof(StringEnumConverter))]
        public MediaKind Kind;

        [JsonProperty("url")] public string Url;
        [JsonProperty("timestampMs")] public long TimestampMs;
    }
}
