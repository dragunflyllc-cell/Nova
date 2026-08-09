using ArTacticalTrainer.Recording;
using ArTacticalTrainer.Scenario;
using UnityEngine;
using UnityEngine.UI;

namespace ArTacticalTrainer.App
{
    /// <summary>
    /// The literal glue between "trainer started a session in the console"
    /// and "this app joins it": a bare-bones form for the three IDs the
    /// trainer console hands out (POST /sessions response + the scenario
    /// it was created from). A real deployment would likely replace this
    /// with a QR code scan of those IDs, but the manual form is enough to
    /// exercise the whole pipeline end to end.
    /// </summary>
    public class SessionBootstrapUI : MonoBehaviour
    {
        [SerializeField] private ScenarioRunner scenarioRunner;
        [SerializeField] private PhotoCapture photoCapture;
        [SerializeField] private SessionRecorderController sessionRecorder;

        [SerializeField] private InputField scenarioIdField;
        [SerializeField] private InputField sessionIdField;
        [SerializeField] private InputField operatorIdField;
        [SerializeField] private Button joinButton;
        [SerializeField] private Text statusText;
        [SerializeField] private GameObject joinPanel;

        private void Awake()
        {
            if (joinButton != null) joinButton.onClick.AddListener(() => _ = JoinAsync());
        }

        private async System.Threading.Tasks.Task JoinAsync()
        {
            string scenarioId = scenarioIdField.text.Trim();
            string sessionId = sessionIdField.text.Trim();
            string operatorId = operatorIdField.text.Trim();

            if (string.IsNullOrEmpty(scenarioId) || string.IsNullOrEmpty(sessionId) || string.IsNullOrEmpty(operatorId))
            {
                SetStatus("Scenario ID, Session ID, and Operator ID are all required.");
                return;
            }

            SetStatus("Loading scenario…");
            bool loaded = await scenarioRunner.LoadAsync(scenarioId);
            if (!loaded)
            {
                SetStatus("Failed to load scenario — check the ID and server connection.");
                return;
            }

            SetStatus("Connecting to trainer console…");
            scenarioRunner.BeginSession(sessionId, operatorId);
            photoCapture?.BeginSession(sessionId);
            sessionRecorder?.BeginSession(sessionId);

            if (joinPanel != null) joinPanel.SetActive(false);
            SetStatus("Session live.");
        }

        private void SetStatus(string message)
        {
            if (statusText != null) statusText.text = message;
            Debug.Log($"SessionBootstrapUI: {message}");
        }
    }
}
