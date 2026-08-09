using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Threading.Tasks;
using ArTacticalTrainer.Networking;
using Newtonsoft.Json.Linq;
using UnityEngine;
using UnityEngine.Networking;
using UnityEngine.XR.ARFoundation;
using UnityEngine.XR.ARSubsystems;

namespace ArTacticalTrainer.Scanning
{
    /// <summary>
    /// Baseline facility scan: accumulates the AR Foundation environment
    /// mesh (ARMeshManager) while walking the space, lets the trainer drop
    /// named anchors for later target placement, then exports an OBJ and
    /// uploads it as a facility's ScanLayout
    /// (server/src/routes/facilities.ts POST /facilities/:id/scan-layouts).
    ///
    /// Mesh quality is platform/hardware dependent: excellent and
    /// real-time on LiDAR iPhones/iPads via ARKit's scene reconstruction,
    /// coarser (and support varies by device) on ARCore. A LiDAR-quality
    /// alternative — Apple's RoomPlan — needs a native Swift plugin; see
    /// <see cref="IRoomPlanBridge"/> for that extension point, intentionally
    /// left unimplemented rather than guessed at.
    /// </summary>
    public class FacilityScanner : MonoBehaviour
    {
        [SerializeField] private ARMeshManager meshManager;
        [SerializeField] private ARRaycastManager raycastManager;

        // Anchor points are recorded as raw world positions from the
        // raycast pose, not wrapped in an ARAnchor — good enough for
        // placing targets within the same AR session the scan happened
        // in. True cross-session persistence (walk in tomorrow, targets
        // still line up) needs ARAnchorManager-backed anchors, ideally
        // Cloud Anchors — flagged as follow-up work in docs/ARCHITECTURE.md
        // rather than implemented against an anchor-creation API that
        // changed shape across recent AR Foundation versions and couldn't
        // be verified without a compiler.
        private readonly List<(string label, Vector3 position)> droppedAnchors = new();
        private readonly List<ARRaycastHit> raycastHits = new();
        private bool scanning;

        public bool IsScanning => scanning;

        public void StartScan()
        {
            scanning = true;
            droppedAnchors.Clear();
            if (meshManager != null) meshManager.enabled = true;
        }

        /// <summary>Raycasts from screen center and records a named anchor point there.</summary>
        public bool TryDropAnchor(string label)
        {
            if (!scanning || raycastManager == null) return false;

            Vector2 screenCenter = new(Screen.width / 2f, Screen.height / 2f);
            if (!raycastManager.Raycast(screenCenter, raycastHits, TrackableType.FeaturePoint | TrackableType.PlaneWithinPolygon))
            {
                return false;
            }

            var hitPose = raycastHits[0].pose;
            droppedAnchors.Add((label, hitPose.position));
            return true;
        }

        public async Task<bool> StopScanAndUploadAsync(string facilityId, string capturedByOperatorId)
        {
            scanning = false;
            if (meshManager == null) return false;

            string objPath = ExportMeshesToObj();
            if (objPath == null) return false;

            string meshUrl = await UploadMeshAsync(objPath);
            if (meshUrl == null) return false;

            return await CreateScanLayoutAsync(facilityId, capturedByOperatorId, meshUrl);
        }

        private string ExportMeshesToObj()
        {
            var meshFilters = meshManager.meshes;
            if (meshFilters == null || meshFilters.Count == 0)
            {
                Debug.LogWarning("FacilityScanner: no mesh data captured — was the AR session tracking during the scan?");
                return null;
            }

            var sb = new StringBuilder();
            int vertexOffset = 1; // OBJ indices are 1-based

            // meshManager.meshes is List<MeshFilter> — one filter per mesh
            // chunk of the environment mesh; the actual geometry is on
            // each filter's sharedMesh.
            foreach (var meshFilter in meshFilters)
            {
                var mesh = meshFilter.sharedMesh;
                if (mesh == null) continue;

                foreach (var v in mesh.vertices)
                {
                    var world = meshFilter.transform.TransformPoint(v);
                    sb.AppendLine(FormattableString.Invariant($"v {world.x} {world.y} {world.z}"));
                }
                var triangles = mesh.triangles;
                for (int i = 0; i < triangles.Length; i += 3)
                {
                    sb.AppendLine(
                        $"f {triangles[i] + vertexOffset} {triangles[i + 1] + vertexOffset} {triangles[i + 2] + vertexOffset}");
                }
                vertexOffset += mesh.vertexCount;
            }

            string path = Path.Combine(Application.temporaryCachePath, $"facility_scan_{DateTime.UtcNow:yyyyMMddHHmmss}.obj");
            File.WriteAllText(path, sb.ToString(), Encoding.ASCII);
            return path;
        }

        private async Task<string> UploadMeshAsync(string objPath)
        {
            var apiBaseUrl = NetworkConfig.Instance != null ? NetworkConfig.Instance.ApiBaseUrl : "http://localhost:4100";
            byte[] bytes = await File.ReadAllBytesAsync(objPath);

            var form = new WWWForm();
            form.AddBinaryData("file", bytes, Path.GetFileName(objPath));

            using var request = UnityWebRequest.Post($"{apiBaseUrl}/media/upload/mesh", form);
            var op = request.SendWebRequest();
            while (!op.isDone) await Task.Yield();

            if (request.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError($"FacilityScanner: mesh upload failed: {request.error}");
                return null;
            }

            var response = JsonUtility.FromJson<UploadUrlResponse>(request.downloadHandler.text);
            return response?.url;
        }

        private async Task<bool> CreateScanLayoutAsync(string facilityId, string capturedByOperatorId, string meshUrl)
        {
            var apiBaseUrl = NetworkConfig.Instance != null ? NetworkConfig.Instance.ApiBaseUrl : "http://localhost:4100";

            var anchors = new JArray();
            for (int i = 0; i < droppedAnchors.Count; i++)
            {
                var (label, pos) = droppedAnchors[i];
                anchors.Add(new JObject
                {
                    ["anchorId"] = $"anchor_{i}",
                    ["label"] = label,
                    ["position"] = new JObject { ["x"] = pos.x, ["y"] = pos.y, ["z"] = pos.z },
                });
            }

            var body = new JObject
            {
                ["meshAssetUrl"] = meshUrl,
                ["capturedByOperatorId"] = capturedByOperatorId,
                ["anchors"] = anchors,
            };

            using var request = new UnityWebRequest($"{apiBaseUrl}/facilities/{facilityId}/scan-layouts", "POST");
            request.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(body.ToString()));
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");

            var op = request.SendWebRequest();
            while (!op.isDone) await Task.Yield();

            if (request.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError($"FacilityScanner: scan-layout create failed: {request.error}");
                return false;
            }
            return true;
        }

        [Serializable]
        private class UploadUrlResponse
        {
            public string url;
        }
    }
}
