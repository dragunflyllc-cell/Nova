using System.Collections;
using System.Collections.Generic;
using ArTacticalTrainer.Core;
using ArTacticalTrainer.Domain;
using ArTacticalTrainer.Networking;
using ArTacticalTrainer.Stats;
using ArTacticalTrainer.Targets;
using UnityEngine;

namespace ArTacticalTrainer.Scenario
{
    /// <summary>
    /// Orchestrates one training run: spawns targets from a
    /// ScenarioDefinitionDto against the local TargetCatalog, drives each
    /// target's scripted behavior timeline, and wires the trainer's live
    /// WebSocket commands (spawn/despawn/set-state/start/end) plus shot
    /// resolution into StatsTracker and back out over TrainerLinkClient so
    /// the trainer console's live view and after-action review both work.
    /// </summary>
    public class ScenarioRunner : MonoBehaviour
    {
        [SerializeField] private TargetCatalog catalog;
        [SerializeField] private ShotResolver shotResolver;
        [SerializeField] private TrainerLinkClient trainerLink;
        [SerializeField] private StatsTracker statsTracker;
        [SerializeField] private Transform targetsParent;
        [SerializeField] private Transform operatorTransform;
        [SerializeField] private float telemetryIntervalSeconds = 0.5f;

        private ScenarioDefinitionDto scenario;
        private readonly Dictionary<string, TargetController> spawnedByPlacementId = new();
        private readonly Dictionary<string, Vector3> facilityAnchorPositions = new();
        private string sessionId;
        private string operatorId;
        private Coroutine telemetryRoutine;

        /// <summary>Populate before Spawn() if the scenario anchors targets to a scanned facility.</summary>
        public void SetFacilityAnchorPositions(IReadOnlyDictionary<string, Vector3> anchors)
        {
            facilityAnchorPositions.Clear();
            foreach (var kv in anchors) facilityAnchorPositions[kv.Key] = kv.Value;
        }

        public async System.Threading.Tasks.Task<bool> LoadAsync(string scenarioId)
        {
            scenario = await ScenarioLoader.LoadAsync(scenarioId);
            return scenario != null;
        }

        public void BeginSession(string forSessionId, string forOperatorId)
        {
            sessionId = forSessionId;
            operatorId = forOperatorId;

            statsTracker.BeginSession(sessionId);

            if (shotResolver != null) shotResolver.ShotResolved += HandleShotResolved;
            if (trainerLink != null)
            {
                trainerLink.OnSpawnTarget += HandleTrainerSpawn;
                trainerLink.OnDespawnTarget += HandleTrainerDespawn;
                trainerLink.OnSetTargetState += HandleTrainerSetState;
                trainerLink.OnStartScenario += _ => StartScenarioTimeline();
                trainerLink.OnEndScenario += HandleTrainerEndScenario;
                trainerLink.Connect(sessionId);
            }

            SpawnAllTargets();

            if (operatorTransform != null && trainerLink != null)
            {
                telemetryRoutine = StartCoroutine(TelemetryLoop());
            }
        }

        public void EndSession()
        {
            if (telemetryRoutine != null) StopCoroutine(telemetryRoutine);
            if (shotResolver != null) shotResolver.ShotResolved -= HandleShotResolved;
            _ = statsTracker.FlushToServerAsync();
            trainerLink?.Disconnect();
        }

        private void SpawnAllTargets()
        {
            if (scenario == null || catalog == null) return;

            foreach (var placement in scenario.Targets)
            {
                var entry = catalog.Find(placement.TargetDefinitionId);
                if (entry?.prefab == null)
                {
                    Debug.LogWarning($"ScenarioRunner: no catalog entry/prefab for targetDefinitionId {placement.TargetDefinitionId}");
                    continue;
                }

                if (!TryResolveWorldPosition(placement.Anchor, out var position)) continue;

                var rotation = Quaternion.Euler(0f, placement.Anchor.RotationYDeg, 0f);
                var instance = Instantiate(entry.prefab, position, rotation, targetsParent);
                var controller = instance.GetComponent<TargetController>();
                if (controller == null)
                {
                    Debug.LogError($"ScenarioRunner: prefab for {placement.TargetDefinitionId} has no TargetController.");
                    Destroy(instance);
                    continue;
                }

                controller.Initialize(placement.Id, placement.TargetDefinitionId, entry.kind);
                controller.StateChanged += HandleTargetStateChanged;
                spawnedByPlacementId[placement.Id] = controller;

                StartCoroutine(RunBehaviorScript(placement));
            }
        }

        private bool TryResolveWorldPosition(SpatialAnchorDto anchor, out Vector3 position)
        {
            if (anchor.Kind == SpatialAnchorKind.World)
            {
                position = anchor.Position.ToVector3();
                return true;
            }

            if (facilityAnchorPositions.TryGetValue(anchor.AnchorId, out var basePos))
            {
                position = basePos + anchor.Offset.ToVector3();
                return true;
            }

            Debug.LogWarning($"ScenarioRunner: facility anchor {anchor.AnchorId} not loaded — skipping target.");
            position = default;
            return false;
        }

        private IEnumerator RunBehaviorScript(TargetPlacementDto placement)
        {
            var sortedSteps = placement.BehaviorScript;
            sortedSteps.Sort((a, b) => a.AtMs.CompareTo(b.AtMs));
            float elapsedMs = 0f;
            foreach (var step in sortedSteps)
            {
                float waitMs = step.AtMs - elapsedMs;
                if (waitMs > 0) yield return new WaitForSeconds(waitMs / 1000f);
                elapsedMs = step.AtMs;

                if (spawnedByPlacementId.TryGetValue(placement.Id, out var controller))
                {
                    controller.SetState(step.SetState);
                }
            }
        }

        private void StartScenarioTimeline()
        {
            // Behavior scripts already run on their own per-target coroutine
            // timers from spawn time; START_SCENARIO is the trainer's cue
            // for scenarios authored to wait at Idle until commanded live.
        }

        private void HandleTrainerSpawn(string placementId)
        {
            if (spawnedByPlacementId.TryGetValue(placementId, out var controller))
            {
                controller.gameObject.SetActive(true);
            }
        }

        private void HandleTrainerDespawn(string placementId)
        {
            if (spawnedByPlacementId.TryGetValue(placementId, out var controller))
            {
                controller.gameObject.SetActive(false);
            }
        }

        private void HandleTrainerSetState(string placementId, TargetRuntimeState state)
        {
            if (spawnedByPlacementId.TryGetValue(placementId, out var controller))
            {
                controller.SetState(state);
            }
        }

        private void HandleTrainerEndScenario()
        {
            EndSession();
        }

        private void HandleTargetStateChanged(TargetController controller, TargetRuntimeState state)
        {
            statsTracker.NotifyTargetStateChanged(controller.PlacementId, state);
            trainerLink?.SendTargetStateChanged(controller.PlacementId, state);
        }

        private void HandleShotResolved(ShotResult result)
        {
            string placementId = result.Target != null ? result.Target.PlacementId : null;
            var shot = statsTracker.RecordShot(placementId, result.Hit, result.Zone);
            trainerLink?.SendShotEvent(shot);
        }

        private IEnumerator TelemetryLoop()
        {
            var wait = new WaitForSeconds(telemetryIntervalSeconds);
            while (true)
            {
                trainerLink.SendTelemetry(operatorTransform.position, operatorTransform.eulerAngles.y);
                yield return wait;
            }
        }
    }
}
