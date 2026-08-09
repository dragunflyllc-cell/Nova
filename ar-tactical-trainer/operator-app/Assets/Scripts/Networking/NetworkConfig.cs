using UnityEngine;

namespace ArTacticalTrainer.Networking
{
    /// <summary>
    /// Single place to point the app at a server instance. Add one
    /// instance to the bootstrap scene; every other network-touching
    /// component reads <see cref="Instance"/>.
    /// </summary>
    public class NetworkConfig : MonoBehaviour
    {
        public static NetworkConfig Instance { get; private set; }

        [SerializeField] private string apiBaseUrl = "http://localhost:4100";
        [SerializeField] private string wsUrl = "ws://localhost:4100/ws";

        public string ApiBaseUrl => apiBaseUrl;
        public string WsUrl => wsUrl;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }
            Instance = this;
            DontDestroyOnLoad(gameObject);
        }
    }
}
