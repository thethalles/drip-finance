# Project Structure Documentation

## Overview
Drip Finance is a React Native mobile application built with Expo and Firebase for personal finance management.

## Technology Stack

### Core Framework
- **React Native 0.76.5**: Cross-platform mobile development framework
- **Expo ~52.0.0**: Development platform and toolchain
- **TypeScript 5.3.3**: Type-safe JavaScript
- **React 18.3.1**: UI library

### Routing
- **Expo Router ~4.0.0**: File-based routing system for React Native
- **react-native-screens ~4.3.0**: Native screen primitives
- **react-native-safe-area-context 4.12.0**: Safe area handling

### Backend Services (Firebase)
- **firebase ^10.8.0**: Firebase SDK
  - **Authentication**: User authentication and management
  - **Firestore**: NoSQL database for storing financial data
  - **Storage**: File storage (for receipts, documents)

### Storage
- **@react-native-async-storage/async-storage ~2.1.0**: Persistent local storage

## Project Structure

```
drip-finance/
│
├── app/                          # Expo Router app directory (file-based routing)
│   ├── _layout.tsx              # Root layout with navigation configuration
│   └── index.tsx                # Home/Welcome screen
│
├── assets/                       # Static assets (images, fonts, icons)
│   └── .gitkeep                 # Placeholder
│
├── config/                       # Configuration files
│   └── firebase.ts              # Firebase initialization and configuration
│
├── utils/                        # Utility functions and helpers
│   └── (to be added)            # Formatting, validation, helpers
│
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore configuration
├── app.json                      # Expo app configuration
├── babel.config.js               # Babel configuration
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Project documentation
```

## Development Workflow

### 1. Initial Setup
```bash
npm install
cp .env.example .env
# Configure Firebase credentials in .env
```

### 2. Running the App
```bash
npm start          # Start Expo dev server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run on web
```

### 3. Type Checking
```bash
npx tsc --noEmit
```

## Firebase Configuration

### Required Services
1. **Authentication**
   - Enable Email/Password authentication
   - Optional: Google, Apple sign-in

2. **Firestore Database**
   - Create collections for:
     - `users` - User profiles
     - `transactions` - Income/expense records
     - `categories` - Transaction categories
     - `budgets` - Budget tracking

3. **Storage** (optional)
   - For storing receipts and documents

### Environment Variables
All Firebase configuration is managed through environment variables:
- `EXPO_PUBLIC_FIREBASE_API_KEY`
- `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `EXPO_PUBLIC_FIREBASE_PROJECT_ID`
- `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `EXPO_PUBLIC_FIREBASE_APP_ID`

## Next Steps

### Recommended Directory Structure Extensions
```
drip-finance/
├── components/              # Reusable UI components
│   ├── buttons/
│   ├── forms/
│   ├── cards/
│   └── modals/
│
├── screens/                 # Screen components (if not using Expo Router fully)
│   ├── auth/
│   ├── dashboard/
│   ├── transactions/
│   └── reports/
│
├── services/                # Business logic and API calls
│   ├── auth.service.ts
│   ├── transaction.service.ts
│   └── budget.service.ts
│
├── hooks/                   # Custom React hooks
│   ├── useAuth.ts
│   ├── useTransactions.ts
│   └── useBudget.ts
│
├── types/                   # TypeScript type definitions
│   ├── transaction.types.ts
│   ├── user.types.ts
│   └── budget.types.ts
│
├── constants/               # App constants
│   ├── colors.ts
│   ├── categories.ts
│   └── config.ts
│
└── utils/                   # Utility functions
    ├── formatters.ts        # Date, currency formatting
    ├── validators.ts        # Input validation
    └── calculations.ts      # Financial calculations
```

## Dependencies Explained

### Production Dependencies
- `expo`: Core Expo framework
- `expo-router`: File-based routing system
- `expo-status-bar`: Status bar component
- `react`: React library
- `react-native`: React Native framework
- `react-native-safe-area-context`: Handle device safe areas
- `react-native-screens`: Native navigation primitives
- `firebase`: Firebase SDK for backend services
- `@react-native-async-storage/async-storage`: Local storage

### Development Dependencies
- `@babel/core`: JavaScript compiler
- `@types/react`: TypeScript definitions for React
- `typescript`: TypeScript compiler

## Best Practices

1. **File Organization**: Follow the Expo Router convention for screens in the `app/` directory
2. **Type Safety**: Use TypeScript for all new files
3. **Component Structure**: Create reusable components in `components/`
4. **Business Logic**: Keep business logic in `services/` separate from UI
5. **Environment Variables**: Never commit `.env` files with real credentials
6. **Git Hygiene**: Review `.gitignore` to avoid committing build artifacts

## Security Considerations

1. Never commit Firebase credentials or API keys
2. Use environment variables for all sensitive data
3. Implement proper authentication flows
4. Validate all user inputs
5. Use Firebase Security Rules for database access control
6. Keep dependencies updated regularly

## Resources

- [Expo Documentation](https://docs.expo.dev/)
- [Expo Router Documentation](https://docs.expo.dev/router/introduction/)
- [React Native Documentation](https://reactnative.dev/)
- [Firebase Documentation](https://firebase.google.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
