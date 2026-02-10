# DRIP FINANCE

Drip Finance is an innovative personal finance management app designed to simplify the financial control of Brazilians. With a focus on accessibility and technology, the app allows you to record income, track spending, filter expenses by category and period, and generate visually friendly reports. The proposal aims to democratize financial management, providing greater organization and motivation for more conscious and healthy financial decisions.

## 🚀 Technologies

This project uses the following technologies:

- **React Native** - Framework for building native mobile apps
- **Expo** (~52.0.0) - Platform for developing React Native apps
- **Expo Router** (~4.0.0) - File-based routing for React Native
- **Firebase** (^10.8.0) - Backend services (Authentication, Firestore Database)
- **TypeScript** - Type-safe JavaScript

## 📋 Prerequisites

Before starting, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)
- Expo Go app on your mobile device (available on iOS and Android)

## 🔧 Installation

1. Clone the repository:
```bash
git clone https://github.com/thethalles/drip-finance.git
cd drip-finance
```

2. Install dependencies:
```bash
npm install
```

3. Configure Firebase:
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication and Firestore Database
   - Copy `.env.example` to `.env`
   - Fill in your Firebase credentials in `.env`

## 🔥 Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select an existing one
3. Go to Project Settings > General > Your apps
4. Click on "Add app" and select the web platform
5. Copy the configuration values to your `.env` file:
```
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
```

6. Enable Authentication methods (Email/Password, Google, etc.)
7. Create a Firestore Database in production mode

## 🏃 Running the Project

Start the development server:
```bash
npm start
```

This will open the Expo Dev Tools. You can:
- Press `a` to run on Android emulator
- Press `i` to run on iOS simulator
- Scan the QR code with Expo Go app on your phone

Alternative commands:
```bash
npm run android  # Run on Android
npm run ios      # Run on iOS
npm run web      # Run on web browser
```

## 📁 Project Structure

```
drip-finance/
├── app/                    # Expo Router app directory
│   ├── _layout.tsx        # Root layout with navigation
│   └── index.tsx          # Home screen
├── assets/                # Images, fonts, and other assets
├── config/                # Configuration files
│   └── firebase.ts        # Firebase initialization
├── utils/                 # Utility functions and helpers
├── .env.example          # Environment variables template
├── .gitignore            # Git ignore rules
├── app.json              # Expo configuration
├── babel.config.js       # Babel configuration
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
└── README.md             # This file
```

## 📱 Features (Planned)

- [ ] User authentication (sign up, login, logout)
- [ ] Record income and expenses
- [ ] Categorize transactions
- [ ] Filter by date and category
- [ ] Generate financial reports
- [ ] Visual charts and graphs
- [ ] Budget tracking
- [ ] Export data

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is under development.

## 📞 Contact

For questions or suggestions, please open an issue in the repository.
