using System.Threading.Tasks;
using ArTacticalTrainer.Domain;
using ArTacticalTrainer.Networking;
using Newtonsoft.Json;
using UnityEngine;
using UnityEngine.Networking;

namespace ArTacticalTrainer.Scenario
{
    public static class ScenarioLoader
    {
        public static async Task<ScenarioDefinitionDto> LoadAsync(string scenarioId)
        {
            var apiBaseUrl = NetworkConfig.Instance != null ? NetworkConfig.Instance.ApiBaseUrl : "http://localhost:4100";
            using var request = UnityWebRequest.Get($"{apiBaseUrl}/scenarios/{scenarioId}");
            var op = request.SendWebRequest();
            while (!op.isDone) await Task.Yield();

            if (request.result != UnityWebRequest.Result.Success)
            {
                Debug.LogError($"ScenarioLoader: failed to load scenario {scenarioId}: {request.error}");
                return null;
            }

            return JsonConvert.DeserializeObject<ScenarioDefinitionDto>(request.downloadHandler.text, JsonSettings.Default);
        }
    }
}
