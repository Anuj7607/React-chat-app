# React Firebase Chat - Starter

## What this contains
- React + Vite starter app
- Firebase auth (email/password) + Firestore messages + Storage avatar upload
- Simple UI and routing

## Setup
1. Create a Firebase project at https://console.firebase.google.com/
2. Add a Web app and copy the firebaseConfig object.
3. In `src/firebase.js` replace the placeholder values with your Firebase config.
4. Enable Authentication (Email/Password), Firestore (in test mode while developing), and Storage (test mode).
5. Install dependencies and run:
   ```bash
   npm install
   npm run dev
   ```
6. Open http://localhost:5173

## Notes
- For production, set proper Firestore and Storage rules.
- Consider using environment variables for config (VITE_*) and not committing secrets.
