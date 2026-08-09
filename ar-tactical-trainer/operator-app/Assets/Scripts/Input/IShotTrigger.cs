using System;

namespace ArTacticalTrainer.Input
{
    /// <summary>
    /// Any source that can fire a shot: the Bluetooth trigger switch on the
    /// training weapon (primary), a screen/reticle tap, or a desktop
    /// keybinding for testing without hardware. <see cref="Core.ShotResolver"/>
    /// subscribes to every enabled trigger and doesn't care which one fires.
    /// </summary>
    public interface IShotTrigger
    {
        event Action TriggerPulled;
    }
}
