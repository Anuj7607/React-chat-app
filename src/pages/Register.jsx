import React, { useState } from "react";
import { auth, db, storage } from "../firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // Added for UX
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Create User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Handle Profile Picture
      let photoURL = "https://ui-avatars.com/api/?name=" + displayName; // Professional fallback
      
      if (avatar) {
        const storageRef = ref(storage, `avatars/${user.uid}`);
        await uploadBytes(storageRef, avatar);
        photoURL = await getDownloadURL(storageRef);
      }

      // 3. Update the Auth Profile
      await updateProfile(user, { displayName, photoURL });

      // 4. THE FIX: Create Firestore Document
      // We use .toLowerCase() so searching is case-insensitive later
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        displayName,
        email: email.toLowerCase(), 
        photoURL
      });

      navigate('/chat');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <h2>Register</h2>
      <form onSubmit={handleRegister} className="auth-form">
        <input required placeholder="Display name" value={displayName} onChange={e=>setDisplayName(e.target.value)} />
        <input required type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} />
        <input required type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />
        <label className="file-label">
          {avatar ? "✅ Image Selected" : "Upload Avatar (Optional)"}
          <input type="file" style={{display: "none"}} accept="image/*" onChange={e=>setAvatar(e.target.files[0])} />
        </label>
        <button type="submit" disabled={loading}>
          {loading ? "Creating Account..." : "Sign Up"}
        </button>
        {error && <p className="error">{error}</p>}
      </form>
      <p className="auth-link">Already have an account? <Link to="/login">Login</Link></p>
    </div>
  );
}