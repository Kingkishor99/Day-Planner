# FocusFlow - Development Guide

## Project Structure

```
src/
├── app/
│   ├── _layout.tsx          # App shell and theme provider
│   ├── index.tsx             # Main planner dashboard (all features)
│   └── explore.tsx           # Sample explore page
├── components/
│   ├── animated-icon.tsx     # Animated icon component
│   └── ... (UI components)
├── constants/
│   └── theme.ts              # Color and typography definitions
├── hooks/
│   └── use-color-scheme.ts   # Theme color scheme hook
└── global.css                # Global styles

assets/
├── expo.icon/                # App icon assets
└── images/                   # Image assets

dist/                          # Web export output
package.json                   # Dependencies and scripts
tsconfig.json                  # TypeScript configuration
app.json                       # Expo app configuration
```

## Key Technologies

### Dependencies

- **expo**: ^57.0.0 - React Native framework
- **react-native**: ^0.86.0 - Core framework
- **react**: ^19.2.3 - UI library
- **expo-router**: ^4.0.0 - File-based routing
- **@react-native-async-storage/async-storage**: Local persistence
- **expo-notifications**: Push notification support
- **react-native-svg**: SVG rendering for charts
- **react-native-safe-area-context**: Safe area support

### Development Tools

- **TypeScript**: Strict type checking
- **Metro Bundler**: Module bundler
- **React Compiler**: Optimized compilation

## Environment Setup

### Requirements

- Node.js 18+
- npm or yarn
- Git

### Installation

```bash
# Clone the repository (if applicable)
git clone <repo-url>
cd Day-Planner

# Install dependencies
npm install

# Install Expo-specific packages
npx expo install @react-native-async-storage/async-storage expo-notifications react-native-svg
```

## Development Workflow

### Start Development Server

```bash
# Web server (localhost:8081)
npx expo start --web

# Native (Expo Go app)
npx expo start
```

### Type Checking

```bash
# Check for TypeScript errors
npx tsc --noEmit
```

### Code Quality

#### Linting (if configured)

```bash
npx eslint src --fix
```

#### Formatting (if configured)

```bash
npx prettier --write src
```

## Build & Export

### Web Export (Static)

```bash
npx expo export --platform web --output-dir dist
```

### Full Export

```bash
npx expo export --platform web --output-dir dist
npx expo export --platform ios --output-dir dist
npx expo export --platform android --output-dir dist
```

### Build for Native

#### iOS

```bash
# Requires EAS CLI
eas build --platform ios
```

#### Android

```bash
# Requires EAS CLI
eas build --platform android
```

## Debugging

### Browser DevTools

1. Open web app in browser
2. Press F12 or right-click → Inspect
3. Use React DevTools extension for component inspection

### Metro Debugger

```bash
# When running expo start --web
Press 'd' to open debugger
```

### Logging

```typescript
// In components/functions
console.log("Debug info:", variable);
console.warn("Warning message");
console.error("Error message");
```

## Feature Implementation Details

### AsyncStorage Usage

```typescript
// Read
const data = await AsyncStorage.getItem(STORAGE_KEY);

// Write
await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));

// Remove
await AsyncStorage.removeItem(STORAGE_KEY);
```

### Notifications

```typescript
// Schedule a notification
await Notifications.scheduleNotificationAsync({
  content: {
    title: "Title",
    body: "Message",
  },
  trigger: {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: new Date(),
  },
});
```

### Animations

```typescript
// Use Animated API
const scaleAnim = useRef(new Animated.Value(1)).current;

Animated.sequence([
  Animated.timing(scaleAnim, {
    toValue: 1.04,
    duration: 180,
    useNativeDriver: true,
  }),
  Animated.timing(scaleAnim, {
    toValue: 1,
    duration: 180,
    useNativeDriver: true,
  }),
]).start();
```

## Testing

### Manual Testing Checklist

- [ ] Create new action
- [ ] Edit existing action
- [ ] Delete action
- [ ] Toggle completion status
- [ ] Check backup/restore
- [ ] Verify local persistence
- [ ] Test notifications
- [ ] Export CSV file
- [ ] View all three view modes (Overview, Weekly, Calendar)
- [ ] Check theme switching (light/dark)
- [ ] Verify responsive layout

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Optimization

### Current Optimizations

1. **React Compiler** - Automatic memoization
2. **useMemo Hooks** - Expensive calculations cached
3. **Static Routes** - Pre-rendered for web
4. **Code Splitting** - Route-based bundles

### Potential Improvements

1. Add virtualization for large lists
2. Implement service workers for offline
3. Optimize SVG chart rendering
4. Add image compression

## Troubleshooting

### Port Already in Use

```bash
# Change port
npx expo start --web --port 3000
```

### Dependencies Not Installing

```bash
# Clear cache and reinstall
rm -rf node_modules
rm package-lock.json
npm install
```

### TypeScript Errors

```bash
# Generate new tsconfig
npx tsc --init
```

### Notifications Not Working

- Ensure browser has permission
- Check browser console for warnings
- Notifications work best on native builds

### Storage Issues

```typescript
// Clear all data
AsyncStorage.clear();

// Check stored data
const keys = await AsyncStorage.getAllKeys();
console.log(keys);
```

## Contributing

### Code Style

- Use TypeScript strict mode
- Follow existing naming conventions
- Add JSDoc comments for complex functions
- Keep components focused and small

### Commit Messages

```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Format code
refactor: Restructure code
test: Add tests
```

## Deployment

### Web Deployment (Vercel/Netlify)

```bash
# Build
npx expo export --platform web --output-dir dist

# Deploy dist/ folder to Vercel or Netlify
```

### Native Deployment

Use EAS (Expo Application Services) for iOS/Android builds and submissions.

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React Hooks Documentation](https://react.dev/reference/react/hooks)

## Support

For issues and questions:

1. Check existing documentation
2. Review code comments
3. Check browser console for errors
4. Review Expo build logs

## License

Proprietary - FocusFlow Daily Planner Application
