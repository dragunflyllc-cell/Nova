using System;
using UnityEngine;
using UnityEngine.InputSystem;

namespace ArTacticalTrainer.Input
{
    /// <summary>
    /// Secondary trigger source: a tap anywhere on screen counts as a
    /// trigger pull (the shot always resolves from the bore-sighted
    /// reticle at screen center regardless of where the tap lands — see
    /// <see cref="Core.ShotResolver"/>). Useful when no trigger switch is
    /// mounted yet, or as a demo/training-wheels mode.
    /// </summary>
    public class ScreenTapTrigger : MonoBehaviour, IShotTrigger
    {
        public event Action TriggerPulled;

        private void Update()
        {
            if (Pointer.current != null && Pointer.current.press.wasPressedThisFrame)
            {
                TriggerPulled?.Invoke();
            }
        }
    }
}
