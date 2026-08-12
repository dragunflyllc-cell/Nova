using System;
using System.Runtime.InteropServices;
using UnityEngine;

namespace ArTacticalTrainer.Input
{
    /// <summary>
    /// v1's default trigger: either hardware volume button on the iPhone
    /// fires a shot, via the well-known "volume button as camera shutter"
    /// technique (native plugin at Assets/Plugins/iOS/ARTVolumeButtonTrigger.mm).
    /// No extra hardware needed to start testing — a Bluetooth trigger
    /// switch (Input/BluetoothHidTrigger.cs) is the natural upgrade once
    /// the core loop is proven out, not a prerequisite for it.
    ///
    /// iOS-only: the native calls are compiled out (and this becomes a
    /// harmless no-op) on every other platform, including the Editor,
    /// since Apple's volume-button-capture APIs have no equivalent
    /// elsewhere. Use ScreenTapTrigger or DesktopTestTrigger for Editor
    /// iteration.
    /// </summary>
    public class VolumeButtonTrigger : MonoBehaviour, IShotTrigger
    {
        public event Action TriggerPulled;

#if UNITY_IOS && !UNITY_EDITOR
        [DllImport("__Internal")]
        private static extern void _ART_StartVolumeButtonCapture(string gameObjectName);

        [DllImport("__Internal")]
        private static extern void _ART_StopVolumeButtonCapture();
#endif

        private void OnEnable()
        {
#if UNITY_IOS && !UNITY_EDITOR
            _ART_StartVolumeButtonCapture(gameObject.name);
#else
            Debug.LogWarning($"{nameof(VolumeButtonTrigger)}: only works in an iOS device build; inert here.");
#endif
        }

        private void OnDisable()
        {
#if UNITY_IOS && !UNITY_EDITOR
            _ART_StopVolumeButtonCapture();
#endif
        }

        /// <summary>
        /// Invoked by the native plugin via
        /// UnitySendMessage(gameObject.name, "OnVolumeButtonPressed", "") —
        /// the method name and this GameObject's name must match what was
        /// passed to _ART_StartVolumeButtonCapture, so this component's
        /// GameObject name must stay stable while enabled.
        /// </summary>
        private void OnVolumeButtonPressed()
        {
            TriggerPulled?.Invoke();
        }
    }
}
