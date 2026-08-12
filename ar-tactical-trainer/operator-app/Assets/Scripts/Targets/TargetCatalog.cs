using System;
using System.Collections.Generic;
using ArTacticalTrainer.Domain;
using UnityEngine;

namespace ArTacticalTrainer.Targets
{
    /// <summary>
    /// Maps server-side TargetDefinition IDs (server/prisma/seed.ts) to the
    /// local prefab a trainer can place. Populate one entry per catalog
    /// row after syncing IDs from a running server (GET /target-definitions).
    /// </summary>
    [CreateAssetMenu(fileName = "TargetCatalog", menuName = "AR Tactical Trainer/Target Catalog")]
    public class TargetCatalog : ScriptableObject
    {
        [Serializable]
        public class Entry
        {
            public string targetDefinitionId;
            public string displayName;
            public TargetKind kind;
            public GameObject prefab;
        }

        [SerializeField] private List<Entry> entries = new();

        public Entry Find(string targetDefinitionId) =>
            entries.Find(e => e.targetDefinitionId == targetDefinitionId);
    }
}
