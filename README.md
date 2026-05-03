A high-performance, 1-on-1 private messaging application built with React, Vite, and Firebase v10+. This application features a sleek, unified dark-mode interface, multi-method authentication, and professional-grade communication features like read receipts and identity linking.

✨ Key Features
🔐 Multi-Method Authentication & Identity
Google Authentication: One-click access with profile sync.

Phone Number (OTP) Login: Secure SMS verification via Firebase Phone Auth.

Email/Password: Standard registration with persistent session management.

Account Linking: Ability to connect Google or Phone credentials to an existing profile later via Profile Settings.

💬 Professional Chat Mechanics
1-on-1 Private Messaging: Dynamically generated private rooms using unique composite IDs to ensure privacy.

Read Receipts (Ticks):

✔ (Single Grey): Message successfully sent to the server.

✔✔ (Double Blue): Message opened and viewed by the recipient in real-time.

Smart User Discovery: Search globally for users using either their Email or Phone Number.

🎨 Premium UI/UX
Unified Dark Theme: A consistent "Slate & Indigo" aesthetic applied across Login, Register, Chat, and Settings views.

Real-time Sidebar: An "Active Chats" list that updates instantly when messages are received or friend requests are accepted.

Custom Interactions: Optimized for speed with Vite and featuring smooth auto-scroll and interactive transitions.

🛠️ Tech Stack
Frontend: React.js, React Router 6, React Icons.

Backend: Firebase (Firestore, Auth, Storage).

State Management: React Hooks (useState, useEffect, useRef).

Data Handling: Real-time Firestore listeners (onSnapshot) and atomic updates.
