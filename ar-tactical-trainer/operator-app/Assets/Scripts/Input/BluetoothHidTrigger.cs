using System;
using UnityEngine;
using UnityEngine.InputSystem;

namespace ArTacticalTrainer.Input
{
    /// <summary>
    /// Primary trigger source: a Bluetooth switch mounted on the training
    /// weapon. Most commercial/DIY trigger switches (repurposed AV
    /// presenter clickers, a BLE HID button on a custom PCB) pair at the OS
    /// level and then simply enumerate to Unity's new Input System as a
    /// generic HID device button — no custom native plugin needed for that
    /// class of hardware.
    ///
    /// <see cref="triggerAction"/> is left unbound by default; assign it to
    /// an Input Action bound to the paired device's button in the Editor
    /// (Window > Analysis > Input Debugger helps identify the binding path
    /// once the switch is paired). A trigger switch that instead speaks
    /// custom BLE GATT (not a HID profile) needs a small native plugin
    /// (CoreBluetooth on iOS / BluetoothLE APIs on Android) — that's
    /// intentionally not guessed at here; wire it up as a second
    /// IShotTrigger implementation that raises the same event once you have
    /// real hardware to test against.
    /// </summary>
    public class BluetoothHidTrigger : MonoBehaviour, IShotTrigger
    {
        [SerializeField] private InputActionReference triggerAction;
        [SerializeField] private float debounceSeconds = 0.08f;

        public event Action TriggerPulled;

        private double lastFireTime = -1;

        private void OnEnable()
        {
            if (triggerAction == null || triggerAction.action == null)
            {
                Debug.LogWarning(
                    $"{nameof(BluetoothHidTrigger)}: no InputActionReference assigned — " +
                    "bind one to the paired trigger switch's button in the Editor.");
                return;
            }

            triggerAction.action.performed += OnActionPerformed;
            triggerAction.action.Enable();
        }

        private void OnDisable()
        {
            if (triggerAction == null || triggerAction.action == null) return;
            triggerAction.action.performed -= OnActionPerformed;
            triggerAction.action.Disable();
        }

        private void OnActionPerformed(InputAction.CallbackContext context)
        {
            double now = context.time;
            if (now - lastFireTime < debounceSeconds) return;
            lastFireTime = now;
            TriggerPulled?.Invoke();
        }
    }
}
