import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { 
  linkWithPopup, 
  GoogleAuthProvider, 
  linkWithPhoneNumber, 
  RecaptchaVerifier 
} from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { FcGoogle } from "react-icons/fc";
import { FiPhone, FiCheckCircle, FiArrowLeft, FiLoader } from "react-icons/fi";

const ProfileSettings = ({ onBack }) => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const user = auth.currentUser;

  // --- 1. Helper: Check if already linked ---
  const isGoogleLinked = user?.providerData.some(p => p.providerId === 'google.com');
  const isPhoneLinked = !!user?.phoneNumber;

  // --- 2. Google Linking Logic ---
  const handleLinkGoogle = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      const result = await linkWithPopup(user, provider);
      // Sync to Firestore
      await updateDoc(doc(db, "users", user.uid), {
        googleLinked: true,
        photoURL: result.user.photoURL,
        email: result.user.email // Ensure email is saved if it wasn't there
      });
      alert("Google linked successfully!");
    } catch (err) {
      setError(err.code === "auth/credential-already-in-use" 
        ? "This Google account is already used by another user." 
        : "Failed to link Google.");
    }
    setLoading(false);
  };

  // --- 3. Phone Linking Logic ---
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container-settings', {
        'size': 'invisible'
      });
    }
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setupRecaptcha();
    try {
      const formattedPhone = phone.startsWith('+') ? phone : "+" + phone;
      const confirmation = await linkWithPhoneNumber(user, formattedPhone, window.recaptchaVerifier);
      setConfirmationResult(confirmation);
      alert("OTP Sent!");
    } catch (err) {
      setError("Failed to send SMS. Check the number format.");
      console.error(err);
    }
    setLoading(false);
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await confirmationResult.confirm(otp);
      // Sync to Firestore so the 'Search by Phone' feature works
      await updateDoc(doc(db, "users", user.uid), {
        phone: user.phoneNumber
      });
      alert("Phone number linked!");
      setConfirmationResult(null);
    } catch (err) {
      setError("Invalid OTP code.");
    }
    setLoading(false);
  };

  return (
    <div className="chat-main" style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div className="auth-container" style={{ position: 'relative' }}>
        
        {/* Back Button */}
        <button onClick={onBack} className="logout-btn" style={{ position: 'absolute', top: '20px', left: '20px' }}>
          <FiArrowLeft /> Back
        </button>

        <h2 style={{ marginTop: '20px' }}>Account Settings</h2>
        <p>Enhance your profile security</p>

        <div className="auth-form" style={{ marginTop: '20px' }}>
          
          {/* Google Connection Card */}
          <div className="input-wrapper" style={{ justifyContent: 'space-between', padding: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FcGoogle size={24} />
              <span>Google</span>
            </div>
            {isGoogleLinked ? (
              <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <FiCheckCircle /> Linked
              </span>
            ) : (
              <button onClick={handleLinkGoogle} className="send-btn" style={{ width: 'auto', padding: '5px 15px', borderRadius: '8px' }}>
                {loading ? <FiLoader className="spin" /> : "Link"}
              </button>
            )}
          </div>

          {/* Phone Connection Card */}
          <div className="input-wrapper" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '15px', padding: '15px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FiPhone size={22} color="#6366f1" />
                <span>Phone Number</span>
              </div>
              {isPhoneLinked && !confirmationResult && (
                <span style={{ color: '#22c55e', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <FiCheckCircle /> {user.phoneNumber}
                </span>
              )}
            </div>

            {!isPhoneLinked && !confirmationResult && (
              <form onSubmit={handleSendOtp} style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="+91..." 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                  style={{ flex: 1 }}
                />
                <button type="submit" className="send-btn" style={{ width: 'auto', padding: '5px 15px', borderRadius: '8px' }}>
                  Send
                </button>
              </form>
            )}

            {confirmationResult && (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', gap: '10px' }}>
                <input 
                  type="text" 
                  placeholder="Enter OTP" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)} 
                  style={{ flex: 1 }}
                />
                <button type="submit" className="send-btn" style={{ width: 'auto', padding: '5px 15px', borderRadius: '8px' }}>
                  Verify
                </button>
              </form>
            )}
          </div>

          {error && <span className="error">{error}</span>}
        </div>

        {/* Recaptcha Anchor */}
        <div id="recaptcha-container-settings"></div>
      </div>
    </div>
  );
};

export default ProfileSettings;