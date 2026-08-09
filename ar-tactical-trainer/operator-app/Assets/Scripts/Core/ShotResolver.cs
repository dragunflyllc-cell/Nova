using System;
using System.Collections.Generic;
using ArTacticalTrainer.Input;
using ArTacticalTrainer.Targets;
using UnityEngine;

namespace ArTacticalTrainer.Core
{
    /// <summary>
    /// The heart of "shoot the screen without firing anything real": on any
    /// subscribed <see cref="IShotTrigger"/> pull, raycasts from the AR
    /// camera straight down its forward vector (the reticle is fixed at
    /// screen center because the phone is bore-sighted to the weapon — see
    /// project README) and resolves a hit/miss against whatever
    /// <see cref="TargetHitZone"/> is in the way.
    /// </summary>
    public class ShotResolver : MonoBehaviour
    {
        [SerializeField] private Camera arCamera;
        [SerializeField] private LayerMask targetLayerMask = ~0;
        [SerializeField] private float maxRange = 100f;
        [SerializeField] private List<MonoBehaviour> triggerSources = new();

        public event Action<ShotResult> ShotResolved;

        private readonly List<IShotTrigger> triggers = new();

        private void Awake()
        {
            if (arCamera == null)
            {
                arCamera = Camera.main;
            }

            foreach (var source in triggerSources)
            {
                if (source is IShotTrigger trigger)
                {
                    triggers.Add(trigger);
                    trigger.TriggerPulled += Fire;
                }
                else if (source != null)
                {
                    Debug.LogWarning($"ShotResolver: {source.name} does not implement IShotTrigger, ignoring.");
                }
            }
        }

        private void OnDestroy()
        {
            foreach (var trigger in triggers)
            {
                trigger.TriggerPulled -= Fire;
            }
        }

        private void Fire()
        {
            if (arCamera == null) return;

            var ray = new Ray(arCamera.transform.position, arCamera.transform.forward);
            ShotResult result;

            if (Physics.Raycast(ray, out var hitInfo, maxRange, targetLayerMask))
            {
                var zone = hitInfo.collider.GetComponent<TargetHitZone>();
                if (zone != null)
                {
                    zone.Owner.RegisterHit(zone.zone);
                    result = new ShotResult(true, zone.zone, zone.Owner, hitInfo.point);
                }
                else
                {
                    result = new ShotResult(false, null, null, hitInfo.point);
                }
            }
            else
            {
                result = new ShotResult(false, null, null, ray.origin + ray.direction * maxRange);
            }

            ShotResolved?.Invoke(result);
        }
    }
}
