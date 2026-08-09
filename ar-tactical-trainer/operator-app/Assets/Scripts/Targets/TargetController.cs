using System;
using System.Collections.Generic;
using ArTacticalTrainer.Domain;
using UnityEngine;

namespace ArTacticalTrainer.Targets
{
    /// <summary>
    /// Runtime behavior for one spawned target instance — hostile, hostage,
    /// or non-threat. Holds the server-assigned placement/definition IDs so
    /// shots and state changes can be reported back correctly, drives an
    /// optional Animator, and exposes the hit-zone colliders
    /// <see cref="Core.ShotResolver"/> raycasts against.
    /// </summary>
    public class TargetController : MonoBehaviour
    {
        [SerializeField] private Animator animator;
        [SerializeField] private List<TargetHitZone> hitZones = new();

        public string PlacementId { get; private set; }
        public string TargetDefinitionId { get; private set; }
        public TargetKind Kind { get; private set; }
        public TargetRuntimeState State { get; private set; } = TargetRuntimeState.Idle;

        public event Action<TargetController, TargetRuntimeState> StateChanged;
        public event Action<TargetController, HitZone> Hit;

        private static readonly int StateParam = Animator.StringToHash("State");

        public void Initialize(string placementId, string targetDefinitionId, TargetKind kind)
        {
            PlacementId = placementId;
            TargetDefinitionId = targetDefinitionId;
            Kind = kind;
            foreach (var zone in hitZones)
            {
                zone.Owner = this;
            }
        }

        public void SetState(TargetRuntimeState newState)
        {
            State = newState;
            if (animator != null)
            {
                animator.SetInteger(StateParam, (int)newState);
            }

            // Neutralized targets stop registering hits; every other state
            // (including noShootHostage) stays live so a hit still counts.
            bool collidersActive = newState != TargetRuntimeState.Neutralized;
            foreach (var zone in hitZones)
            {
                zone.GetComponent<Collider>().enabled = collidersActive;
            }

            StateChanged?.Invoke(this, newState);
        }

        /// <summary>
        /// Called by ShotResolver after a raycast hit resolves to one of
        /// this target's zones. A hostile target on a chest/head hit
        /// auto-transitions to Neutralized; hostages/non-threats never
        /// auto-transition on hit — a hit there is the operator's error to
        /// be scored, not a state change on the target.
        /// </summary>
        public void RegisterHit(HitZone zone)
        {
            Hit?.Invoke(this, zone);
            if (Kind == TargetKind.Hostile && State == TargetRuntimeState.Hostile &&
                zone is HitZone.Head or HitZone.Chest)
            {
                SetState(TargetRuntimeState.Neutralized);
            }
        }

        public IReadOnlyList<TargetHitZone> HitZones => hitZones;
    }
}
