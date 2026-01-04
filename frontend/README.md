# Kefir Producer App - Frontend

A cross-platform mobile and web application for managing kefir fermentation batches. Built with Expo, React Native, TypeScript, and NativeWind.

## Features

- 🔐 **Passwordless Authentication**: Email OTP login via AWS Amplify
- 📊 **Dashboard**: Track reminders (overdue, today, upcoming)
- 🧪 **Batch Management**: Create, view, edit, and delete fermentation batches
- ⏰ **Smart Reminders**: Stage-based notifications for fermentation tracking
- 📸 **Photo Upload**: Document batches with photos (S3 integration ready)
- 📱 **QR Codes**: Generate and scan batch QR codes for quick access
- 🌐 **Cross-Platform**: iOS, Android, and Web support
- 🎨 **Modern UI**: TailwindCSS styling with NativeWind
- 🔔 **Push Notifications**: Expo Notifications integration

## Tech Stack

- **Framework**: Expo SDK 54+
- **Language**: TypeScript
- **Styling**: NativeWind 4.x (Tailwind CSS for React Native)
- **Navigation**: Expo Router (file-based routing)
- **Authentication**: AWS Amplify + Cognito (passwordless email OTP)
- **State Management**: React Context API
- **QR Codes**: react-native-qrcode-svg, expo-camera
- **Notifications**: expo-notifications
- **Image Handling**: expo-image-picker

## Project Structure

```
frontend/
├── app/                      # Expo Router app directory
│   ├── (auth)/              # Authentication screens
│   │   ├── login.tsx
│   │   └── verify.tsx
│   ├── (tabs)/              # Main app tab screens
│   │   ├── index.tsx        # Dashboard
│   │   ├── batches.tsx      # Batches list
│   │   └── settings.tsx     # Settings
│   ├── batch/               # Batch-related screens
│   │   ├── [id].tsx         # Batch detail
│   │   ├── create.tsx       # Create batch
│   │   └── edit/[id].tsx    # Edit batch
│   ├── b/[id].tsx           # Deep link handler
│   ├── scan.tsx             # QR scanner
│   └── _layout.tsx          # Root layout
├── components/              # Reusable components
│   ├── QRCode.tsx
│   └── PhotoUpload.tsx
├── services/                # Business logic & API
│   ├── auth.ts              # Authentication service
│   ├── AuthContext.tsx      # Auth state management
│   ├── mockApi.ts           # Mock API (development)
│   ├── api.ts               # Production API client
│   ├── notifications.ts     # Push notifications
│   ├── photoService.ts      # Photo upload to S3
│   └── amplifyConfig.ts     # AWS Amplify configuration
├── types/                   # TypeScript types
│   └── index.ts
├── utils/                   # Utility functions
│   ├── datetime.ts          # Date/time helpers
│   └── validation.ts        # Form validation
├── assets/                  # Static assets
├── global.css               # Global Tailwind styles
├── tailwind.config.js       # Tailwind configuration
└── metro.config.js          # Metro bundler config

```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- iOS: Xcode (macOS only)
- Android: Android Studio

### Installation

1. Clone the repository and navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
# Create .env file (note: .env is gitignored)
# The app will use mock data by default
```

Required environment variables:
```env
EXPO_PUBLIC_API_URL=http://localhost:3000/api
EXPO_PUBLIC_WEB_URL=https://kefirproducer.com
EXPO_PUBLIC_USE_MOCK_API=true
EXPO_PUBLIC_AWS_REGION=us-east-1
EXPO_PUBLIC_AWS_USER_POOL_ID=us-east-1_XXXXXXX
EXPO_PUBLIC_AWS_USER_POOL_WEB_CLIENT_ID=XXXXXXXXX
```

### Running the App

Start the development server:
```bash
npm start
```

Then press:
- `i` for iOS simulator
- `a` for Android emulator
- `w` for web browser

Or use specific commands:
```bash
npm run ios      # Run on iOS
npm run android  # Run on Android
npm run web      # Run on web
```

## Development Mode

The app is configured to use **mock authentication and mock API** by default for development. This allows you to:

- Test all features without backend dependencies
- Use any email with OTP code (check console for code)
- Work with pre-populated sample data

### Mock Auth Flow
1. Enter any email on login screen
2. Click "Continue"
3. Check console for 6-digit OTP code
4. Enter the code to sign in

## Authentication Setup

### Mock Authentication (Development)
The app uses mock authentication by default. Check the console for the OTP code after entering your email.

### AWS Amplify (Production)
To use real AWS Cognito authentication:

1. Set up AWS Cognito User Pool with email OTP
2. Update `.env` with your Cognito credentials
3. Set `EXPO_PUBLIC_USE_MOCK_API=false`
4. Update `services/auth.ts` to use Amplify methods

## Features Guide

### Batch Management
- **Create Batch**: Tap the + button on the Batches screen
- **View Details**: Tap any batch card
- **Edit**: Use the edit icon in batch detail
- **Delete**: Use the trash icon in batch detail

### QR Codes
- **Generate**: Automatic for each batch
- **Scan**: Settings → Scan QR Code (camera on mobile, manual on web)
- **Share**: Tap batch QR code to share

### Reminders
- Automatically created based on target fermentation times
- Grouped by: Overdue, Today, Upcoming
- Mark complete from batch detail screen

### Photos
- Add from batch detail screen
- Take new photo or choose from library
- Ready for S3 presigned URL integration

## Building for Production

### Web
```bash
npm run build:web
```
Output in `dist/` directory. Deploy to Vercel/Netlify.

### iOS
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build for iOS
eas build --platform ios
```

### Android
```bash
eas build --platform android
```

## Customization

### Colors
Edit `tailwind.config.js` to customize the color scheme:
```js
theme: {
  extend: {
    colors: {
      primary: {
        // Your brand colors
      },
    },
  },
},
```

### App Configuration
Edit `app.json` for:
- App name and slug
- Bundle identifiers
- Icons and splash screens
- Permissions

## API Integration

To connect to a real backend:

1. Set `EXPO_PUBLIC_USE_MOCK_API=false` in `.env`
2. Update `EXPO_PUBLIC_API_URL` with your API endpoint
3. The app will automatically use the production API client

The API service (`services/api.ts`) includes:
- Automatic authentication headers
- Retry logic for failed requests
- Error handling
- Request/response logging

## Deep Linking

The app supports deep linking for QR codes:
- URL format: `https://kefirproducer.com/b/{batchId}`
- App scheme: `kefirproducer://b/{batchId}`

Configure in `app.json`:
```json
{
  "expo": {
    "scheme": "kefirproducer"
  }
}
```

## Troubleshooting

### Metro bundler cache issues
```bash
npx expo start -c
```

### iOS simulator issues
```bash
npx expo run:ios --device
```

### Android build issues
```bash
cd android && ./gradlew clean
cd .. && npx expo run:android
```

### NativeWind not working
1. Check `tailwind.config.js` content paths
2. Verify `global.css` is imported in `_layout.tsx`
3. Clear Metro cache: `npx expo start -c`

## Contributing

1. Create a feature branch
2. Make your changes
3. Test on iOS, Android, and Web
4. Submit a pull request

## License

[Your License Here]

## Support

For issues and questions:
- GitHub Issues: [Link]
- Email: [Your Email]
- Documentation: [Link]

