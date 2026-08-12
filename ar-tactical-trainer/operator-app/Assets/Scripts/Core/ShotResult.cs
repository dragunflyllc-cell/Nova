using ArTacticalTrainer.Domain;
using ArTacticalTrainer.Targets;
using UnityEngine;

namespace ArTacticalTrainer.Core
{
    public readonly struct ShotResult
    {
        public readonly bool Hit;
        public readonly HitZone? Zone;
        public readonly TargetController Target;
        public readonly Vector3 Point;

        public ShotResult(bool hit, HitZone? zone, TargetController target, Vector3 point)
        {
            Hit = hit;
            Zone = zone;
            Target = target;
            Point = point;
        }
    }
}
