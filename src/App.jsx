import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Sidebar from "./components/Sidebar"; 
import Chat from "./components/Chat";
import ProfileSettings from "./components/ProfileSettings"; 
import { auth } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  
  // NEW: State to toggle between the Chat window and the Settings window
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleLogout = () => {
    signOut(auth);
    setSelectedUser(null);
    setShowSettings(false); // Reset view on logout
  };

  if (loading) return <div className="center">Loading...</div>;

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/chat" /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to="/chat" /> : <Register />} />
      
      <Route 
        path="/chat" 
        element={
          user ? (
            <div className="chat-page">
              <Sidebar 
                currentUser={user} 
                handleLogout={handleLogout} 
                // Logic: clicking a user closes settings and opens the chat
                onSelectUser={(u) => {
                  setSelectedUser(u);
                  setShowSettings(false);
                }} 
                // Logic: clicking the gear opens the Settings screen
                onShowSettings={() => setShowSettings(true)}
              />
              
              {/* Conditional Rendering: If showSettings is true, display the Settings screen. 
                  Otherwise, display the Chat window. */}
              {showSettings ? (
                <ProfileSettings onBack={() => setShowSettings(false)} />
              ) : (
                <Chat 
                  currentUser={user} 
                  chatPartner={selectedUser} 
                />
              )}
            </div>
          ) : (
            <Navigate to="/" />
          )
        } 
      />
    </Routes>
  );
}