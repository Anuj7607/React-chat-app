import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  updateDoc
} from 'firebase/firestore';
import { FiLogOut, FiSearch, FiMessageSquare, FiSettings, FiUserPlus, FiClock } from 'react-icons/fi';

const Sidebar = ({ currentUser, handleLogout, onSelectUser, onShowSettings }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [chatList, setChatList] = useState([]); // List of active friends/chats
  const [err, setErr] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null); // 'pending', 'friends', or null

  // 1. Fetch Active Chats/Friends
  useEffect(() => {
    if (!currentUser.uid) return;

    // Listen for any chat where the current user is a participant
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUser.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChatList(chats);
    });

    return () => unsub();
  }, [currentUser.uid]);

  // 2. Search Logic with Friendship Check
  const handleSearch = async (e) => {
    e.preventDefault();
    setErr(false);
    setFoundUser(null);
    setRequestStatus(null);
    
    const term = searchQuery.trim();
    if (!term || term === currentUser.email) return;

    try {
      const emailQuery = query(collection(db, "users"), where("email", "==", term));
      const emailSnap = await getDocs(emailQuery);

      let userDoc = null;
      if (!emailSnap.empty) {
        userDoc = emailSnap.docs[0].data();
      } else {
        const formattedPhone = term.startsWith('+') ? term : "+" + term;
        const phoneQuery = query(collection(db, "users"), where("phone", "==", formattedPhone));
        const phoneSnap = await getDocs(phoneQuery);
        if (!phoneSnap.empty) userDoc = phoneSnap.docs[0].data();
      }

      if (userDoc) {
        setFoundUser(userDoc);
        // Check if a chat already exists between these two
        const combinedId = currentUser.uid > userDoc.uid 
          ? currentUser.uid + "_" + userDoc.uid 
          : userDoc.uid + "_" + currentUser.uid;
        
        const chatRef = query(collection(db, "chats"), where("chatId", "==", combinedId));
        const chatSnap = await getDocs(chatRef);
        
        if (!chatSnap.empty) {
          setRequestStatus('friends');
        }
      } else {
        setErr(true);
      }
    } catch (error) {
      setErr(true);
    }
  };

  // 3. Send Friend Request (Creates the Chat document)
  const handleSendRequest = async () => {
    if (!foundUser) return;

    const combinedId = currentUser.uid > foundUser.uid 
      ? currentUser.uid + "_" + foundUser.uid 
      : foundUser.uid + "_" + currentUser.uid;

    try {
      await addDoc(collection(db, "chats"), {
        chatId: combinedId,
        participants: [currentUser.uid, foundUser.uid],
        users: [
          { uid: currentUser.uid, displayName: currentUser.displayName, photoURL: currentUser.photoURL },
          { uid: foundUser.uid, displayName: foundUser.displayName, photoURL: foundUser.photoURL }
        ],
        status: "pending", // You can use this to block messaging until accepted
        createdAt: serverTimestamp()
      });
      setRequestStatus('pending');
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Chats</h2>
      </div>

      {/* Search Section */}
      <div style={{ padding: '15px' }}>
        <form onSubmit={handleSearch} className="input-wrapper" style={{ padding: '5px 15px' }}>
          <input 
            type="text" 
            placeholder="Search email or phone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button type="submit" className="logout-btn" style={{ color: '#6366f1' }}>
            <FiSearch size={18} />
          </button>
        </form>
        {err && <span className="error" style={{ display: 'block', marginTop: '10px' }}>No user found!</span>}
      </div>

      {/* Search Result Display */}
      {foundUser && (
        <div className="user-info" style={{ cursor: 'default', margin: '0 15px', border: '1px solid #6366f1' }}>
          <img src={foundUser.photoURL || `https://ui-avatars.com/api/?name=${foundUser.displayName}`} alt="user" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600' }}>{foundUser.displayName}</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              {requestStatus === 'friends' ? 'Already Friends' : 'Not in your list'}
            </div>
          </div>
          
          {requestStatus === 'friends' ? (
            <button onClick={() => onSelectUser(foundUser)} className="send-btn" style={{ width: '35px', height: '35px' }}>
              <FiMessageSquare size={16} />
            </button>
          ) : requestStatus === 'pending' ? (
            <FiClock size={20} color="#94a3b8" title="Request Sent" />
          ) : (
            <button onClick={handleSendRequest} className="send-btn" style={{ width: '35px', height: '35px', background: '#22c55e' }}>
              <FiUserPlus size={16} />
            </button>
          )}
        </div>
      )}

      {/* --- ACTIVE CHATS LIST --- */}
      <div style={{ flex: 1, overflowY: 'auto', marginTop: '10px' }}>
        <p style={{ padding: '0 20px', fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px' }}>Recent</p>
        {chatList.map(chat => {
          const partner = chat.users.find(u => u.uid !== currentUser.uid);
          return (
            <div key={chat.id} className="user-info" onClick={() => onSelectUser(partner)} style={{ cursor: 'pointer', background: 'transparent', margin: '5px 15px' }}>
              <img src={partner?.photoURL || `https://ui-avatars.com/api/?name=${partner?.displayName}`} alt="avatar" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '500' }}>{partner?.displayName}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Click to chat</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Current User Profile (Bottom) */}
      <div className="user-info" style={{ marginTop: 'auto', borderTop: '1px solid #1e293b', borderRadius: '0', margin: '0', padding: '20px' }}>
        <img src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${currentUser?.displayName}`} alt="me" />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div style={{ fontWeight: '600', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden' }}>
            {currentUser?.displayName}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Online</div>
        </div>
        <button onClick={onShowSettings} className="logout-btn" title="Settings" style={{ color: '#94a3b8' }}>
          <FiSettings size={20} />
        </button>
        <button onClick={handleLogout} className="logout-btn" title="Logout">
          <FiLogOut size={20} />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;