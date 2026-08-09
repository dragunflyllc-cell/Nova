// Native iOS plugin: fires a Unity callback on every hardware volume
// button press (up or down), the standard "volume button as camera
// shutter" technique used by countless iOS camera apps. Paired with
// Input/VolumeButtonTrigger.cs on the Unity side.
//
// How it works: AVAudioSession's outputVolume can be observed via KVO,
// and system volume can only be *set* programmatically through a hidden
// MPVolumeView's internal UISlider (there's no public API to set it
// directly). So: put a 1x1 MPVolumeView off-screen (this also happens to
// suppress the system volume HUD overlay), lock the volume near the
// middle of its range, and on every KVO change treat it as "a button was
// pressed," notify Unity, then snap the volume back to the locked value
// so there's always room to detect the next press in either direction.
//
// This is a well-precedented pattern, not a novel one — but it has not
// been run on a real device from this codebase. First thing to sanity
// check once this is in Xcode: the initial KVO callback on observer
// registration should be swallowed by the ignoreNextChange window below;
// if a phantom trigger fires right on scene start, widen that window.

#import <AVFoundation/AVFoundation.h>
#import <MediaPlayer/MediaPlayer.h>
#import <UIKit/UIKit.h>

// Provided by Unity's iOS runtime at link time; no public header ships
// for it, so this extern declaration is the standard way every Unity iOS
// native plugin picks it up.
extern "C" void UnitySendMessage(const char *gameObjectName, const char *methodName, const char *message);

@interface ARTVolumeButtonListener : NSObject
@property(nonatomic, strong) NSString *unityGameObjectName;
@property(nonatomic, strong) MPVolumeView *hiddenVolumeView;
@property(nonatomic, assign) float lockedVolume;
@property(nonatomic, assign) BOOL ignoreChanges;
- (void)start;
- (void)stop;
@end

@implementation ARTVolumeButtonListener

- (void)start {
    NSError *error = nil;
    AVAudioSession *session = [AVAudioSession sharedInstance];
    [session setCategory:AVAudioSessionCategoryAmbient
             withOptions:AVAudioSessionCategoryOptionMixWithOthers
                   error:&error];
    [session setActive:YES error:&error];

    self.hiddenVolumeView = [[MPVolumeView alloc] initWithFrame:CGRectMake(-1000, -1000, 1, 1)];
    UIWindow *window = [UIApplication sharedApplication].delegate.window;
    [window addSubview:self.hiddenVolumeView];

    self.ignoreChanges = YES;

    self.lockedVolume = session.outputVolume;
    if (self.lockedVolume < 0.15f || self.lockedVolume > 0.85f) {
        self.lockedVolume = 0.5f;
        [self applySystemVolume:self.lockedVolume];
    }

    [session addObserver:self forKeyPath:@"outputVolume" options:NSKeyValueObservingOptionNew context:nil];

    // The observer-add above and any applySystemVolume call just now both
    // trigger spurious KVO callbacks; stop ignoring shortly after both
    // have had a chance to land.
    dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.5 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
        self.ignoreChanges = NO;
    });
}

- (void)stop {
    @try {
        [[AVAudioSession sharedInstance] removeObserver:self forKeyPath:@"outputVolume"];
    } @catch (NSException *exception) {
        // not observing — fine
    }
    [self.hiddenVolumeView removeFromSuperview];
    self.hiddenVolumeView = nil;
}

- (void)applySystemVolume:(float)volume {
    UISlider *volumeSlider = nil;
    for (UIView *view in self.hiddenVolumeView.subviews) {
        if ([view isKindOfClass:[UISlider class]]) {
            volumeSlider = (UISlider *)view;
            break;
        }
    }
    if (volumeSlider != nil) {
        volumeSlider.value = volume;
        [volumeSlider sendActionsForControlEvents:UIControlEventTouchUpInside];
    }
}

- (void)observeValueForKeyPath:(NSString *)keyPath
                       ofObject:(id)object
                         change:(NSDictionary *)change
                        context:(void *)context {
    if (![keyPath isEqualToString:@"outputVolume"]) {
        return;
    }
    if (self.ignoreChanges) {
        return;
    }

    if (self.unityGameObjectName != nil) {
        UnitySendMessage([self.unityGameObjectName UTF8String], "OnVolumeButtonPressed", "");
    }

    self.ignoreChanges = YES;
    dispatch_async(dispatch_get_main_queue(), ^{
        [self applySystemVolume:self.lockedVolume];
        dispatch_after(dispatch_time(DISPATCH_TIME_NOW, (int64_t)(0.3 * NSEC_PER_SEC)), dispatch_get_main_queue(), ^{
            self.ignoreChanges = NO;
        });
    });
}

@end

static ARTVolumeButtonListener *artSharedListener = nil;

extern "C" {

void _ART_StartVolumeButtonCapture(const char *gameObjectName) {
    if (artSharedListener == nil) {
        artSharedListener = [[ARTVolumeButtonListener alloc] init];
    }
    artSharedListener.unityGameObjectName = [NSString stringWithUTF8String:gameObjectName];
    [artSharedListener start];
}

void _ART_StopVolumeButtonCapture(void) {
    [artSharedListener stop];
}

}
