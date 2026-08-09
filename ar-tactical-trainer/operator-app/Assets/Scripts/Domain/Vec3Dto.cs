using Newtonsoft.Json;
using UnityEngine;

namespace ArTacticalTrainer.Domain
{
    /// <summary>
    /// Mirrors packages/shared-types/src/geometry.ts Vec3. Kept distinct
    /// from UnityEngine.Vector3 so wire (de)serialization stays explicit;
    /// convert at the boundary via <see cref="ToVector3"/>/<see cref="FromVector3"/>.
    /// </summary>
    [System.Serializable]
    public class Vec3Dto
    {
        [JsonProperty("x")] public float X;
        [JsonProperty("y")] public float Y;
        [JsonProperty("z")] public float Z;

        public Vector3 ToVector3() => new(X, Y, Z);

        public static Vec3Dto FromVector3(Vector3 v) => new() { X = v.x, Y = v.y, Z = v.z };
    }
}
