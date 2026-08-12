using System;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace ArTacticalTrainer.Domain
{
    public enum SpatialAnchorKind
    {
        World,
        FacilityAnchor,
    }

    /// <summary>
    /// Mirrors the SpatialAnchor discriminated union in
    /// packages/shared-types/src/geometry.ts. C# has no native discriminated
    /// union, so this is one class with a <see cref="Kind"/> tag plus the
    /// converter below reading/writing only the fields relevant to that kind
    /// — keeping the wire shape identical to the TS type instead of a fat
    /// object with always-present null fields.
    /// </summary>
    [JsonConverter(typeof(SpatialAnchorConverter))]
    public class SpatialAnchorDto
    {
        public SpatialAnchorKind Kind;
        public Vec3Dto Position;      // set when Kind == World
        public string AnchorId;       // set when Kind == FacilityAnchor
        public Vec3Dto Offset;        // set when Kind == FacilityAnchor
        public float RotationYDeg;

        public static SpatialAnchorDto World(Vec3Dto position, float rotationYDeg) => new()
        {
            Kind = SpatialAnchorKind.World,
            Position = position,
            RotationYDeg = rotationYDeg,
        };

        public static SpatialAnchorDto FacilityAnchor(string anchorId, Vec3Dto offset, float rotationYDeg) => new()
        {
            Kind = SpatialAnchorKind.FacilityAnchor,
            AnchorId = anchorId,
            Offset = offset,
            RotationYDeg = rotationYDeg,
        };
    }

    public class SpatialAnchorConverter : JsonConverter<SpatialAnchorDto>
    {
        public override void WriteJson(JsonWriter writer, SpatialAnchorDto value, JsonSerializer serializer)
        {
            var obj = new JObject { ["rotationYDeg"] = value.RotationYDeg };
            if (value.Kind == SpatialAnchorKind.World)
            {
                obj["kind"] = "world";
                obj["position"] = JObject.FromObject(value.Position, serializer);
            }
            else
            {
                obj["kind"] = "facilityAnchor";
                obj["anchorId"] = value.AnchorId;
                obj["offset"] = JObject.FromObject(value.Offset, serializer);
            }
            obj.WriteTo(writer);
        }

        public override SpatialAnchorDto ReadJson(
            JsonReader reader, Type objectType, SpatialAnchorDto existingValue,
            bool hasExistingValue, JsonSerializer serializer)
        {
            var obj = JObject.Load(reader);
            string kind = obj["kind"]?.ToString();
            float rotation = obj["rotationYDeg"]?.ToObject<float>() ?? 0f;

            if (kind == "facilityAnchor")
            {
                return SpatialAnchorDto.FacilityAnchor(
                    obj["anchorId"]?.ToString(),
                    obj["offset"]?.ToObject<Vec3Dto>(serializer),
                    rotation);
            }

            return SpatialAnchorDto.World(obj["position"]?.ToObject<Vec3Dto>(serializer), rotation);
        }
    }
}
