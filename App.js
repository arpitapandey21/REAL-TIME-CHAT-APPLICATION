import React, { useEffect, useRef } from 'react';
import { useWebSocket, USERS } from './hooks/useWebSocket';
import {
  Sidebar, MessageBubble, DateDivider,
  TypingBubble, ChatInput, formatDateLabel,
} from './components/Components';

export default function App() {
  const { status, messages, typingUsers, sendMessage } = useWebSocket();
  const bottomRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Build grouped message list with date dividers
  const grouped = [];
  let lastDate = null;
  let lastUserId = null;

  messages.forEach((msg, i) => {
    const dateLabel = formatDateLabel(msg.timestamp);
    if (dateLabel !== lastDate) {
      grouped.push({ type: 'date', label: dateLabel, key: `date-${i}` });
      lastDate = dateLabel;
      lastUserId = null;
    }
    const showName = msg.userId !== lastUserId;
    const nextMsg  = messages[i + 1];
    const showAvatar = !nextMsg
      || nextMsg.userId !== msg.userId
      || formatDateLabel(nextMsg.timestamp) !== dateLabel;

    grouped.push({ type: 'msg', msg, showName, showAvatar });
    lastUserId = msg.userId;
  });

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--off-white)' }}>

      {/* ── Sidebar ─────────────────────────────── */}
      <Sidebar
        status={status}
        totalMessages={messages.filter(m => m.userId !== 'user').length}
        typingUsers={typingUsers}
      />

      {/* ── Main Chat ────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Header */}
        <div style={{
          padding: '15px 28px',
          borderBottom: '1.5px solid var(--pink-200)',
          background: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          boxShadow: '0 2px 10px rgba(247,89,171,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 13,
              background: 'linear-gradient(135deg,#fff0f6,#ffd6e7)',
              border: '1.5px solid var(--pink-200)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, color: 'var(--pink-600)', fontWeight: 700,
            }}>#</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
                general
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                {messages.length} messages · {USERS.length} members online
              </div>
            </div>
          </div>

          {/* Online avatars */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {USERS.slice(1).map((u, i) => (
              <div key={u.id} style={{
                marginLeft: i === 0 ? 0 : -8,
                width: 30, height: 30, borderRadius: '50%',
                background: `linear-gradient(135deg,${u.color},#ffadd2)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#fff',
                border: '2px solid #fff',
                boxShadow: `0 2px 6px ${u.color}44`,
                fontFamily: 'var(--font-display)',
              }}>{u.avatar}</div>
            ))}
            <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--pink-500)', fontWeight: 600 }}>
              {USERS.length - 1} online
            </span>
          </div>
        </div>

        {/* Messages */}
        <div style={{
          flex: 1, overflowY: 'auto',
          padding: '20px 28px',
          background: 'linear-gradient(180deg,var(--off-white) 0%,#fff 100%)',
        }}>
          {status === 'CONNECTING' ? (
            /* Loading state */
            <div style={{
              height: '100%', display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: 14, animation: 'fadeIn 0.4s ease',
            }}>
              <div style={{ fontSize: 38 }}>💕</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-main)', fontFamily: 'var(--font-display)' }}>
                Connecting to chat...
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-light)' }}>
                Setting up your WebSocket connection
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: 'var(--pink-400)', display: 'block',
                    animation: 'bounce 1.2s infinite',
                    animationDelay: `${i * 0.2}s`,
                  }} />
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Welcome banner */}
              <div style={{
                textAlign: 'center', padding: '20px 0 18px',
                borderBottom: '1.5px dashed var(--pink-200)', marginBottom: 14,
              }}>
                <div style={{ fontSize: 30, marginBottom: 6 }}>🌸</div>
                <div style={{ fontSize: 17, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-main)', marginBottom: 4 }}>
                  Welcome to #general
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  This is the beginning of your conversation 💕
                </div>
              </div>

              {/* Message list */}
              {grouped.map(item => {
                if (item.type === 'date') {
                  return <DateDivider key={item.key} label={item.label} />;
                }
                const { msg, showName, showAvatar } = item;
                const user = USERS.find(u => u.id === msg.userId);
                if (!user) return null;
                return (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    user={user}
                    isOwn={msg.userId === 'user'}
                    showAvatar={showAvatar}
                    showName={showName}
                  />
                );
              })}

              <TypingBubble users={typingUsers} />
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Input */}
        <ChatInput onSend={sendMessage} disabled={status !== 'OPEN'} />
      </div>
    </div>
  );
}
