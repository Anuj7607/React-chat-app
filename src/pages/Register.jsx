import React, { useState } from "react";
import { auth, db, storage } from "../firebase";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      let photoURL = '';
      if (avatar) {
        const storageRef = ref(storage, `avatars/${user.uid}_${avatar.name}`);
        await uploadBytes(storageRef, avatar);
        photoURL = await getDownloadURL(storageRef);
        await updateProfile(user, { displayName, photoURL });
      } else {
        await updateProfile(user, { displayName });
      }

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email,
        displayName,
        photoURL
      });

      navigate('/chat');
    } catch (err) {
      setError(err.message);
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
          Avatar (optional)
          <input type="file" accept="image/*" onChange={e=>setAvatar(e.target.files[0])} />
        </label>
        <button type="submit">Sign Up</button>
        {error && <p className="error">{error}</p>}
        <div id="recaptcha-container"></div>
      </form>
    </div>
  );
}
