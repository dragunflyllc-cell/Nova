using System;
using UnityEngine;
using UnityEngine.InputSystem;

namespace ArTacticalTrainer.Input
{
    /// <summary>
    /// Desktop/editor-only trigger: space bar or left mouse button. For
    /// iterating on scenario/target logic in the Editor without a phone or
    /// trigger hardware attached.
    /// </summary>
    public class DesktopTestTrigger : MonoBehaviour, IShotTrigger
    {
        public event Action TriggerPulled;

        private void Update()
        {
            bool spacePressed = Keyboard.current != null && Keyboard.current.spaceKey.wasPressedThisFrame;
            bool mousePressed = Mouse.current != null && Mouse.current.leftButton.wasPressedThisFrame;
            if (spacePressed || mousePressed)
            {
                TriggerPulled?.Invoke();
            }
        }
    }
}
