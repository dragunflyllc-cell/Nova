using System;
using System.Collections;
using System.IO;
using ArTacticalTrainer.Core;
using UnityEngine;

namespace ArTacticalTrainer.Recording
{
    /// <summary>
    /// Captures a still on every resolved shot for data collection — pure
    /// Unity API (ScreenCapture), no native plugin needed. Uploaded
    /// alongside the shot event so after-action review can show exactly
    /// what the operator saw at the moment of each trigger pull.
    /// </summary>
    public class PhotoCapture : MonoBehaviour
    {
        [SerializeField] private ShotResolver shotResolver;
        [SerializeField] private bool captureOnMissToo = true;

        private string sessionId;

        public void BeginSession(string forSessionId)
        {
            sessionId = forSessionId;
        }

        private void OnEnable()
        {
            if (shotResolver != null) shotResolver.ShotResolved += HandleShotResolved;
        }

        private void OnDisable()
        {
            if (shotResolver != null) shotResolver.ShotResolved -= HandleShotResolved;
        }

        private void HandleShotResolved(ShotResult result)
        {
            if (!result.Hit && !captureOnMissToo) return;
            if (string.IsNullOrEmpty(sessionId)) return;
            StartCoroutine(CaptureAndUpload());
        }

        private IEnumerator CaptureAndUpload()
        {
            long timestampMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            string fileName = $"shot_{timestampMs}.png";
            string path = Path.Combine(Application.temporaryCachePath, fileName);

            ScreenCapture.CaptureScreenshot(path);
            // CaptureScreenshot writes asynchronously; two frames is the
            // commonly-used safe margin (no hard guarantee is documented).
            yield return null;
            yield return null;

            _ = MediaUploader.UploadSessionMediaAsync(path, sessionId, "photo", timestampMs);
        }
    }
}
