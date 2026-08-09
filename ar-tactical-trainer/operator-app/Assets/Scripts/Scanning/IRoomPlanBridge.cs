using System.Threading.Tasks;

namespace ArTacticalTrainer.Scanning
{
    /// <summary>
    /// Extension point for Apple's RoomPlan (iOS 16+, LiDAR devices only) —
    /// parametric, far higher-fidelity room capture (walls, doors, windows,
    /// furniture as typed objects) than the raw mesh <see cref="FacilityScanner"/>
    /// exports. RoomPlan is Swift/ARKit-only with no Unity/C# API, so a real
    /// implementation is a native iOS plugin (a small Swift class wrapping
    /// RoomCaptureSession, bridged to C# via a .mm/.swift plugin and
    /// [DllImport("__Internal")] — the standard Unity-iOS-native pattern).
    /// That plugin can't be responsibly hand-written without an iOS
    /// toolchain and a LiDAR device to test against, so it's deliberately
    /// left as this interface stub rather than guessed at. Implement it,
    /// wire the result into FacilityScanner's upload path (same
    /// POST /facilities/:id/scan-layouts contract, just a richer mesh/anchor
    /// set), and this becomes the preferred scan path on supported devices.
    /// </summary>
    public interface IRoomPlanBridge
    {
        bool IsSupportedOnThisDevice();
        void StartCapture();

        /// <summary>Returns a local file path to the exported room model, or null if unavailable.</summary>
        Task<string> StopCaptureAsync();
    }
}
