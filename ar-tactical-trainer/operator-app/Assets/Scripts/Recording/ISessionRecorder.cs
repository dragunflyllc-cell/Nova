using System.Threading.Tasks;

namespace ArTacticalTrainer.Recording
{
    /// <summary>
    /// Full-session video capture of the AR view (camera passthrough +
    /// overlay) for after-action review. There's no cross-platform managed
    /// API for this — real implementations wrap native screen recording:
    /// ReplayKit (RPScreenRecorder) on iOS, MediaProjection on Android.
    /// Both need a small native plugin (Swift/Obj-C or Java/Kotlin) that
    /// isn't guessed at here since it can't be compiled or tested in this
    /// environment; <see cref="NullSessionRecorder"/> is the default no-op
    /// so the rest of the app (photo capture, stats, live relay) works
    /// today without it. Wire a real implementation in as a second
    /// MonoBehaviour implementing this interface once you have a device to
    /// test against — see docs/ARCHITECTURE.md.
    /// </summary>
    public interface ISessionRecorder
    {
        void StartRecording();

        /// <summary>Stops recording and returns the local file path, or null if unavailable.</summary>
        Task<string> StopRecordingAsync();
    }
}
