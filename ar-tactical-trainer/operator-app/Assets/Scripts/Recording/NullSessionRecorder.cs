using System.Threading.Tasks;
using UnityEngine;

namespace ArTacticalTrainer.Recording
{
    /// <summary>Default no-op ISessionRecorder — see interface doc for why.</summary>
    public class NullSessionRecorder : MonoBehaviour, ISessionRecorder
    {
        public void StartRecording()
        {
            Debug.Log("NullSessionRecorder: no native recorder wired up; session video will not be captured.");
        }

        public Task<string> StopRecordingAsync() => Task.FromResult<string>(null);
    }
}
