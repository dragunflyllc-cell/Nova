using ArTacticalTrainer.Domain;
using UnityEngine;

namespace ArTacticalTrainer.Targets
{
    /// <summary>
    /// Attach to each hit-zone collider (head/chest/limb) on a target
    /// prefab. <see cref="Core.ShotResolver"/> reads this off whatever
    /// collider the reticle raycast hits.
    /// </summary>
    [RequireComponent(typeof(Collider))]
    public class TargetHitZone : MonoBehaviour
    {
        public HitZone zone;
        public TargetController Owner;
    }
}
