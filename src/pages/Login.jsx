import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { auth, db } from "../firebase";
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup,
  RecaptchaVerifier,
  signInWithPhoneNumber
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { FcGoogle } from "react-icons/fc";
import { FiPhone, FiMail, FiLock } from "react-icons/fi";

const Login = () => {
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState("email"); // 'email' or 'phone'
  
  // Phone Auth States
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [confirmationResult, setConfirmationResult] = useState(null);
  
  const navigate = useNavigate();

  // Helper: Sync User to Firestore (Crucial for Search)
  const syncUserToFirestore = async (user) => {
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        displayName: user.displayName || "New User",
        email: user.email || "",
        phone: user.phoneNumber || "",
        photoURL: user.photoURL || "",
        createdAt: new Date(),
      });
    }
  };

  // 1. Google Auth
  const handleGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const res = await signInWithPopup(auth, provider);
      await syncUserToFirestore(res.user);
      navigate("/chat");
    } catch (err) {
      setErr(true);
    }
  };

  // 2. Email Auth
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    const email = e.target[0].value;
    const password = e.target[1].value;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/chat");
    } catch (err) {
      setErr(true);
    }
  };

  // 3. Phone Auth Logic
  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible'
      });
    }
  };

  const handlePhoneSignIn = async (e) => {
    e.preventDefault();
    setupRecaptcha();
    const appVerifier = window.recaptchaVerifier;
    try {
      const confirmation = await signInWithPhoneNumber(auth, "+" + phone, appVerifier);
      setConfirmationResult(confirmation);
    } catch (error) {
      setErr(true);
    }
  };

  const verifyOtp = async (e) => {
    e.preventDefault();
    try {
      const res = await confirmationResult.confirm(otp);
      await syncUserToFirestore(res.user);
      navigate("/chat");
    } catch (err) {
      setErr(true);
    }
  };

  return (
    <div className="center">
      <div className="auth-container">
        <h2 style={{ marginBottom: "20px", textAlign: "center" }}>Welcome Back</h2>
        
        {/* Toggle between Email and Phone */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button 
            className="logout-btn" 
            style={{ flex: 1, background: view === 'email' ? '#3b82f6' : '#1e293b', color: 'white' }}
            onClick={() => setView('email')}
          >
            <FiMail /> Email
          </button>
          <button 
            className="logout-btn" 
            style={{ flex: 1, background: view === 'phone' ? '#3b82f6' : '#1e293b', color: 'white' }}
            onClick={() => setView('phone')}
          >
            <FiPhone /> Phone
          </button>
        </div>

        {view === "email" ? (
          <form onSubmit={handleEmailSubmit} className="auth-form">
            <input type="email" placeholder="email" required />
            <input type="password" placeholder="password" required />
            <button disabled={loading}>Sign in</button>
          </form>
        ) : (
          <div className="auth-form">
            {!confirmationResult ? (
              <form onSubmit={handlePhoneSignIn} className="auth-form">
                <input 
                  type="text" 
                  placeholder="Phone (e.g. 919876543210)" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)} 
                />
                <button type="submit">Send OTP</button>
              </form>
            ) : (
              <form onSubmit={verifyOtp} className="auth-form">
                <input 
                  type="text" 
                  placeholder="Enter 6-digit OTP" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)} 
                />
                <button type="submit">Verify & Login</button>
              </form>
            )}
          </div>
        )}

        <div style={{ margin: "20px 0", textAlign: "center", color: "#64748b" }}>OR</div>

        <button onClick={handleGoogle} className="logout-btn" style={{ width: '100%', background: 'white', color: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <FcGoogle size={20} /> Continue with Google
        </button>

        {err && <span className="error">Something went wrong</span>}
        <p style={{ marginTop: "20px", textAlign: "center", fontSize: "0.9rem" }}>
          You don't have an account? <Link to="/register" style={{ color: "#3b82f6" }}>Register</Link>
        </p>
        
        {/* Hidden Recaptcha Anchor */}
        <div id="recaptcha-container"></div>
      </div>
    </div>
  );
};

export default Login;