// import React from 'react';

export function HelpChatBubble() {
  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: '#007bff',
      color: 'white',
      borderRadius: '50%',
      width: '50px',
      height: '50px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
    }}>
      💬
    </div>
  );
} 