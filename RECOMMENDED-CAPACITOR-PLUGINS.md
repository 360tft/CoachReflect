# Recommended Capacitor Plugins for Coach Reflection

These are optional plugins you might want to add based on Coach Reflection's features.

## Currently Configured

- **@capacitor/core** - Core Capacitor functionality
- **@capacitor/ios** - iOS platform support
- **@capacitor/android** - Android platform support
- Push Notifications - Configured in capacitor.config.ts

## Recommended Additional Plugins

### High Priority

#### 1. @capacitor/app
**Purpose:** Handle app lifecycle events, deep links, and app state

```bash
npm install @capacitor/app
```

**Use cases:**
- Handle app going to background/foreground
- Deep linking to specific reflections
- App state restoration

**Example:**
```typescript
import { App } from '@capacitor/app';

App.addListener('appStateChange', ({ isActive }) => {
  if (isActive) {
    // Refresh data when app comes to foreground
  }
});
```

#### 2. @capacitor/share
**Purpose:** Native share functionality (share reflections, insights)

```bash
npm install @capacitor/share
```

**Use cases:**
- Share reflection insights with other coaches
- Share progress/streaks on social media
- Export and share analysis

**Example:**
```typescript
import { Share } from '@capacitor/share';

await Share.share({
  title: 'My Coaching Reflection',
  text: 'Check out my latest coaching insight',
  url: 'https://coachreflection.com/share/123',
});
```

#### 3. @capacitor/haptics
**Purpose:** Haptic feedback (vibrations) for better UX

```bash
npm install @capacitor/haptics
```

**Use cases:**
- Haptic feedback when completing a reflection
- Vibrate on streak milestones
- Tactile feedback for important actions

**Example:**
```typescript
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// Light tap when saving reflection
await Haptics.impact({ style: ImpactStyle.Light });

// Stronger feedback for streak milestone
await Haptics.impact({ style: ImpactStyle.Heavy });
```

#### 4. @capacitor/status-bar
**Purpose:** Customize status bar appearance (iOS/Android top bar)

```bash
npm install @capacitor/status-bar
```

**Use cases:**
- Match status bar color to app branding
- Hide status bar on splash screen
- Light/dark mode consistency

**Example:**
```typescript
import { StatusBar, Style } from '@capacitor/status-bar';

// Set to match dark theme
await StatusBar.setStyle({ style: Style.Dark });
await StatusBar.setBackgroundColor({ color: '#0A0A0A' });
```

### Medium Priority

#### 5. @capacitor/local-notifications
**Purpose:** Schedule local notifications (reminder to reflect)

```bash
npm install @capacitor/local-notifications
```

**Use cases:**
- Daily reflection reminder
- Streak reminders
- Follow-up prompts after sessions

**Example:**
```typescript
import { LocalNotifications } from '@capacitor/local-notifications';

// Remind coach to reflect every evening
await LocalNotifications.schedule({
  notifications: [
    {
      title: "Time to reflect",
      body: "How did today's session go?",
      id: 1,
      schedule: { at: new Date(Date.now() + 1000 * 60 * 60) } // 1 hour from now
    }
  ]
});
```

#### 6. @capacitor/network
**Purpose:** Detect network status (online/offline)

```bash
npm install @capacitor/network
```

**Use cases:**
- Show offline message when network unavailable
- Queue reflections when offline, sync when online
- Warn before data-heavy operations on cellular

**Example:**
```typescript
import { Network } from '@capacitor/network';

const status = await Network.getStatus();
if (!status.connected) {
  // Show "You're offline" message
}

Network.addListener('networkStatusChange', status => {
  // Handle connection changes
});
```

#### 7. @capacitor/keyboard
**Purpose:** Keyboard behavior and event handling

```bash
npm install @capacitor/keyboard
```

**Use cases:**
- Adjust UI when keyboard appears
- Smooth scrolling when keyboard opens
- Keyboard accessory bar for reflection input

**Example:**
```typescript
import { Keyboard } from '@capacitor/keyboard';

Keyboard.addListener('keyboardWillShow', info => {
  // Adjust layout before keyboard appears
});

Keyboard.addListener('keyboardDidHide', () => {
  // Reset layout
});
```

### Lower Priority (Nice to Have)

#### 8. @capacitor/splash-screen
**Purpose:** Control splash screen behavior

```bash
npm install @capacitor/splash-screen
```

**Use cases:**
- Show branded splash screen on app launch
- Hide splash screen after data loads

#### 9. @capacitor/camera
**Purpose:** Take photos or access photo library

```bash
npm install @capacitor/camera
```

**Use cases:**
- Upload session photos to reflections
- Capture whiteboard diagrams
- Profile picture uploads

**Note:** Only add if you want photo upload features.

#### 10. @capacitor/filesystem
**Purpose:** Read/write files on device

```bash
npm install @capacitor/filesystem
```

**Use cases:**
- Offline reflection drafts
- Export reflections as PDF
- Cache AI responses

**Note:** Only needed if you want offline-first functionality.

## Installation Pattern

If you decide to add any of these:

```bash
# Install the plugin
npm install @capacitor/[plugin-name]

# Sync to native projects
npm run cap:sync

# Import and use in your code
import { PluginName } from '@capacitor/[plugin-name]';
```

## My Recommendation for Coach Reflection

**Install now (before app store submission):**
1. @capacitor/app - Essential for deep links and app lifecycle
2. @capacitor/share - Users will want to share insights
3. @capacitor/haptics - Adds polish to UX
4. @capacitor/status-bar - Brand consistency

**Install later (based on user feedback):**
1. @capacitor/local-notifications - If users request reminders
2. @capacitor/network - If offline support becomes important
3. @capacitor/keyboard - If keyboard UX needs improvement
4. @capacitor/camera - Only if you add photo upload features

## Total Additional Install (Recommended)

```bash
npm install @capacitor/app @capacitor/share @capacitor/haptics @capacitor/status-bar
npm run cap:sync
```

This adds ~200KB to the bundle but significantly improves mobile UX.

## Configuration

After installing, update `capacitor.config.ts` if needed:

```typescript
plugins: {
  PushNotifications: {
    presentationOptions: ['badge', 'sound', 'alert']
  },
  StatusBar: {
    backgroundColor: '#0A0A0A',
    style: 'dark'
  },
  LocalNotifications: {
    smallIcon: 'ic_stat_icon_config_sample',
    iconColor: '#E5A11C'
  }
}
```

## Resources

- [Official Capacitor Plugins](https://capacitorjs.com/docs/apis)
- [Community Plugins](https://github.com/capacitor-community)
- [Plugin API Docs](https://capacitorjs.com/docs/apis)
