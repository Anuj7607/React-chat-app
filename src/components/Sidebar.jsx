import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  setDoc, // Changed from addDoc to setDoc for predictable IDs
  doc,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { FiLogOut, FiSearch, FiMessageSquare, FiSettings, FiUserPlus, FiClock, FiX } from 'react-icons/fi';

const Sidebar = ({ currentUser, handleLogout, onSelectUser, onShowSettings }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [foundUser, setFoundUser] = useState(null);
  const [chatList, setChatList] = useState([]);
  const [err, setErr] = useState(false);
  const [requestStatus, setRequestStatus] = useState(null); 
  const [isSearching, setIsSearching] = useState(false);

  // 1. Fetch Active Chats (Sorted by latest activity)
  useEffect(() => {
    if (!currentUser.uid) return;

    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", currentUser.uid),
      orderBy("lastUpdatedAt", "desc") // Sorts most recent chats to the top
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

  // 2. Updated Search Logic
  const handleSearch = async (e) => {
    e.preventDefault();
    setErr(false);
    setFoundUser(null);
    setRequestStatus(null);
    setIsSearching(true);
    
    // Normalize input to lowercase to match our new registration logic
    const term = searchQuery.trim().toLowerCase();
    if (!term || term === currentUser.email.toLowerCase()) {
      setIsSearching(false);
      return;
    }

    try {
      // Search by Email
      const emailQuery = query(collection(db, "users"), where("email", "==", term));
      const emailSnap = await getDocs(emailQuery);

      let userDoc = null;
      if (!emailSnap.empty) {
        userDoc = emailSnap.docs[0].data();
      } else {
        // Fallback: Search by Phone
        const formattedPhone = term.startsWith('+') ? term : "+" + term;
        const phoneQuery = query(collection(db, "users"), where("phone", "==", formattedPhone));
        const phoneSnap = await getDocs(phoneQuery);
        if (!phoneSnap.empty) userDoc = phoneSnap.docs[0].data();
      }

      if (userDoc) {
        setFoundUser(userDoc);
        
        // Use the consistent combinedId logic
        const combinedId = currentUser.uid > userDoc.uid 
          ? currentUser.uid + "_" + userDoc.uid 
          : userDoc.uid + "_" + currentUser.uid;
        
        // Check if a chat/request already exists
        const chatSnap = await getDocs(query(collection(db, "chats"), where("chatId", "==", combinedId)));
        
        if (!chatSnap.empty) {
          const chatData = chatSnap.docs[0].data();
          setRequestStatus(chatData.status); // 'pending' or 'accepted'
        }
      } else {
        setErr(true);
      }
    } catch (error) {
      console.error("Search Error:", error);
      setErr(true);
    } finally {
      setIsSearching(false);
    }
  };

  // 3. Handle Send Request
  const handleSendRequest = async () => {
    if (!foundUser) return;

    const combinedId = currentUser.uid > foundUser.uid 
      ? currentUser.uid + "_" + foundUser.uid 
      : foundUser.uid + "_" + currentUser.uid;

    try {
      // Using setDoc with combinedId prevents duplicate chat documents
      await setDoc(doc(db, "chats", combinedId), {
        chatId: combinedId,
        participants: [currentUser.uid, foundUser.uid],
        users: [
          { uid: currentUser.uid, displayName: currentUser.displayName, photoURL: currentUser.photoURL },
          { uid: foundUser.uid, displayName: foundUser.displayName, photoURL: foundUser.photoURL }
        ],
        status: "pending", 
        createdAt: serverTimestamp(),
        lastUpdatedAt: serverTimestamp(),
        lastMessage: "Friend request sent"
      });
      setRequestStatus('pending');
    } catch (e) {
      console.error("Request Error:", e);
    }
  };

  const clearSearch = () => {
    setFoundUser(null);
    setSearchQuery("");
    setErr(false);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>Chats</h2>
      </div>

      {/* Search Input */}
      <div style={{ padding: '15px' }}>
        <form onSubmit={handleSearch} className="input-wrapper" style={{ padding: '5px 15px' }}>
          <input 
            type="text" 
            placeholder="Search email or phone..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {foundUser ? (
             <FiX size={18} onClick={clearSearch} style={{ cursor: 'pointer', color: '#ef4444' }} />
          ) : (
            <button type="submit" className="logout-btn" style={{ color: '#6366f1' }}>
              <FiSearch size={18} />
            </button>
          )}
        </form>
        {err && <span className="error" style={{ display: 'block', marginTop: '10px', fontSize: '0.8rem' }}>No user found in Delhi/NCR directory.</span>}
      </div>

      {/* Search Result Display */}
      {foundUser && (
        <div className="user-info search-result-box" style={{ margin: '0 15px', border: '1px solid #6366f1', background: '#1e293b' }}>
          <img src={foundUser.photoURL || `https://ui-avatars.com/api/?name=${foundUser.displayName}`} alt="user" />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: '600' }}>{foundUser.displayName}</div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              {requestStatus === 'accepted' ? 'Already Friends' : requestStatus === 'pending' ? 'Request Pending' : 'New User'}
            </div>
          </div>
          
          {requestStatus === 'accepted' ? (
            <button onClick={() => { onSelectUser(foundUser); clearSearch(); }} className="send-btn">
              <FiMessageSquare size={16} />
            </button>
          ) : requestStatus === 'pending' ? (
            <div title="Waiting for acceptance"><FiClock size={20} color="#f59e0b" /></div>
          ) : (
            <button onClick={handleSendRequest} className="send-btn" style={{ background: '#22c55e' }}>
              <FiUserPlus size={16} />
            </button>
          )}
        </div>
      )}

      {/* Recent Chats List */}
      <div style={{ flex: 1, overflowY: 'auto', marginTop: '10px' }} className="custom-scrollbar">
        <p className="section-title" style={{ padding: '0 20px', fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase' }}>Recent Activity</p>
        {chatList.length === 0 && <p style={{ padding: '20px', color: '#475569', fontSize: '0.85rem' }}>No active chats found.</p>}
        {chatList.map(chat => {
          const partner = chat.users.find(u => u.uid !== currentUser.uid);
          return (
            <div key={chat.id} className="user-info chat-item" onClick={() => onSelectUser(partner)}>
              <img src={partner?.photoURL || `https://ui-avatars.com/api/?name=${partner?.displayName}`} alt="avatar" />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: '500' }}>{partner?.displayName}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {chat.lastMessage || "Tap to chat"}
                </div>
              </div>
              {chat.status === 'pending' && <span className="pending-tag">Pending</span>}
            </div>
          );
        })}
      </div>

      {/* User Footer */}
      <div className="sidebar-footer">
        <img src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${currentUser?.displayName}`} alt="me" />
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <div className="user-name-footer">{currentUser?.displayName}</div>
          <div className="status-online">Active Now</div>
        </div>
        <button onClick={onShowSettings} className="footer-icon-btn"><FiSettings size={20} /></button>
        <button onClick={handleLogout} className="footer-icon-btn logout-color"><FiLogOut size={20} /></button>
      </div>
    </div>
  );
};

export default Sidebar;