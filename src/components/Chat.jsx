import React, { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp,
  doc,
  updateDoc,
  where,
  getDocs
} from "firebase/firestore";
import { FiSend, FiUser, FiCheck } from "react-icons/fi";

const Chat = ({ currentUser, chatPartner }) => {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState([]);
  const scrollRef = useRef();

  const chatId = chatPartner
    ? currentUser.uid > chatPartner.uid
      ? `${currentUser.uid}_${chatPartner.uid}`
      : `${chatPartner.uid}_${currentUser.uid}`
    : null;

  // 1. Listen for messages
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "chats", chatId, "messages"),
      orderBy("createdAt", "asc")
    );

    const unsub = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsub();
  }, [chatId]);

  // 2. MARK AS READ: Update partner's messages to 'read' when you view them
  useEffect(() => {
    const markMessagesAsRead = async () => {
      if (!chatId || !chatPartner || messages.length === 0) return;

      // Filter for messages sent BY the partner that are currently only 'sent'
      const unreadMessages = messages.filter(
        (m) => m.uid === chatPartner.uid && m.status === "sent"
      );

      // Update each unread message to 'read' in Firestore
      for (const msg of unreadMessages) {
        const msgRef = doc(db, "chats", chatId, "messages", msg.id);
        await updateDoc(msgRef, { status: "read" });
      }
    };

    markMessagesAsRead();
  }, [messages, chatId, chatPartner]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 3. Send message with 'sent' status
  const onSubmit = async (e) => {
    e.preventDefault();
    if (text.trim() === "" || !chatId) return;

    await addDoc(collection(db, "chats", chatId, "messages"), {
      text: text,
      uid: currentUser.uid,
      displayName: currentUser.displayName,
      photoURL: currentUser.photoURL,
      createdAt: serverTimestamp(),
      status: "sent", // Initial status is always 'sent' (single grey tick)
    });

    setText("");
  };

  if (!chatPartner) {
    return (
      <div className="chat-main center">
        <div style={{ textAlign: 'center', opacity: 0.5 }}>
          <FiUser size={48} style={{ marginBottom: '10px' }} />
          <p>Select a friend to start chatting</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-main">
      <div className="sidebar-header" style={{ borderBottom: '1px solid #1e293b', background: '#0f172a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '0 10px' }}>
          <img 
            src={chatPartner.photoURL || `https://ui-avatars.com/api/?name=${chatPartner.displayName}`} 
            alt="partner" 
            style={{ width: '35px', height: '35px', borderRadius: '50%', border: '1px solid #334155' }}
          />
          <span style={{ fontWeight: '600' }}>{chatPartner.displayName}</span>
        </div>
      </div>

      <div className="messages">
        {messages.map((msg) => (
          <div key={msg.id} className={`message ${msg.uid === currentUser.uid ? 'me' : ''}`}>
            <img 
              src={msg.photoURL || `https://ui-avatars.com/api/?name=${msg.displayName}`} 
              alt="avatar" 
            />
            <div className="bubble">
              <div className="meta">{msg.displayName}</div>
              <p>{msg.text}</p>
              
              {/* TICK IMPLEMENTATION */}
              {msg.uid === currentUser.uid && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2px' }}>
                  {msg.status === "read" ? (
                    // Double Blue Ticks
                    <div style={{ display: 'flex' }}>
                      <FiCheck size={14} color="#3b82f6" />
                      <FiCheck size={14} color="#3b82f6" style={{ marginLeft: '-8px' }} />
                    </div>
                  ) : (
                    // Single Grey Tick
                    <FiCheck size={14} color="#94a3b8" />
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <form className="send-form" onSubmit={onSubmit}>
        <div className="input-wrapper">
          <input 
            type="text" 
            placeholder={`Message ${chatPartner.displayName}...`} 
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <button type="submit" className="send-btn" disabled={!text.trim()}>
            <FiSend size={18} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chat;