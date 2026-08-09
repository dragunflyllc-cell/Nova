using System;
using System.IO;
using System.Threading.Tasks;
using ArTacticalTrainer.Networking;
using UnityEngine;
using UnityEngine.Networking;

namespace ArTacticalTrainer.Recording
{
    /// <summary>
    /// Shared multipart upload to server/src/routes/media.ts. Used by both
    /// PhotoCapture (per-hit stills) and SessionRecorder implementations
    /// (full session video) so there's one place that knows the
    /// POST /media/upload/session contract.
    /// </summary>
    public static class MediaUploader
    {
        public static async Task<bool> UploadSessionMediaAsync(
            string filePath, string sessionId, string kind, long timestampMs)
        {
            if (!File.Exists(filePath))
            {
                Debug.LogError($"MediaUploader: file not found: {filePath}");
                return false;
            }

            var apiBaseUrl = NetworkConfig.Instance != null ? NetworkConfig.Instance.ApiBaseUrl : "http://localhost:4100";
            byte[] bytes = await File.ReadAllBytesAsync(filePath);

            var form = new WWWForm();
            form.AddField("sessionId", sessionId);
            form.AddField("kind", kind);
            form.AddField("timestampMs", timestampMs.ToString());
            form.AddBinaryData("file", bytes, Path.GetFileName(filePath));

            using var request = UnityWebRequest.Post($"{apiBaseUrl}/media/upload/session", form);
            var op = request.SendWebRequest();
            while (!op.isDone) await Task.Yield();

            if (request.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError($"MediaUploader: upload failed: {request.error}");
                return false;
            }
            return true;
        }
    }
}
