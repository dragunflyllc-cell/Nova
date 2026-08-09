using System;
using UnityEngine;

namespace ArTacticalTrainer.Recording
{
    /// <summary>
    /// Drives whichever ISessionRecorder is assigned (defaults to
    /// NullSessionRecorder) across a session's lifetime and uploads the
    /// result via the same MediaUploader path.PhotoCapture uses.
    /// </summary>
    public class SessionRecorderController : MonoBehaviour
    {
        [SerializeField] private MonoBehaviour recorderSource; // must implement ISessionRecorder

        private ISessionRecorder recorder;
        private string sessionId;

        private void Awake()
        {
            recorder = recorderSource as ISessionRecorder;
            if (recorder == null)
            {
                Debug.LogWarning($"{nameof(SessionRecorderController)}: recorderSource does not implement ISessionRecorder.");
            }
        }

        public void BeginSession(string forSessionId)
        {
            sessionId = forSessionId;
            recorder?.StartRecording();
        }

        public async void EndSession()
        {
            if (recorder == null) return;
            string path = await recorder.StopRecordingAsync();
            if (string.IsNullOrEmpty(path)) return;

            long timestampMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
            await MediaUploader.UploadSessionMediaAsync(path, sessionId, "video", timestampMs);
        }
    }
}
