'use client';

import { useState, useRef, useEffect } from 'react';

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hey! 👋 I\'m your Vibin AI Assistant.\n\nI remember: The Day One Code is **VIBE15** (15% off Drop 01).\n\nAsk me about the app, business plan, hiring, or tech stack.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  async function sendMessage() {
    if (!input.trim()) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/ai-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      });

      const data = await res.json();

      if (data.content) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error connecting to assistant. Check /api/ai-assistant route.' }]);
    }

    setLoading(false);
  }

  return (
    <>
      {/* AI Assistant Button */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '24px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: '#00ff00',
          color: '#0a0a0a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,255,0,0.3)',
          zIndex: 1000,
          border: 'none',
          transition: 'transform 0.2s',
          transform: isOpen ? 'scale(0.9)' : 'scale(1)'
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? '✕' : '🤖'}
      </div>

      {/* AI Assistant Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '96px',
            left: '24px',
            width: '400px',
            height: '500px',
            background: '#0a0a0a',
            border: '1px solid #3a3a3a',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 1000,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)'
          }}
        >
          {/* Header */}
          <div style={{
            background: '#00ff00',
            color: '#0a0a0a',
            padding: '16px 20px',
            position: 'relative'
          }}>
            <div style={{
              fontFamily: 'Anton, sans-serif',
              fontSize: '18px',
              letterSpacing: '.04em',
              textTransform: 'uppercase'
            }}>
              Vibin AI Assistant
            </div>
            <div style={{
              fontSize: '11px',
              fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '.1em',
              textTransform: 'uppercase',
              marginTop: '2px'
            }}>
              Always here to help — Day One Code: VIBE15
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                position: 'absolute',
                right: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: '#0a0a0a',
                fontSize: '18px',
                cursor: 'pointer'
              }}
            >
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{
                  maxWidth: '80%',
                  padding: '10px 14px',
                  fontSize: '13px',
                  lineHeight: '1.5',
                  fontFamily: 'Manrope, sans-serif',
                  ...(msg.role === 'user'
                    ? { background: '#00ff00', color: '#0a0a0a' }
                    : { background: '#1a1a1a', color: '#f6f1e7', border: '1px solid #3a3a3a' }
                )}}>
                  {msg.content.split('\n').map((line, idx) => (
                    <div key={idx} style={{ whiteSpace: 'pre-wrap' }}>{line}</div>
                  ))}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  background: '#1a1a1a',
                  padding: '10px 14px',
                  border: '1px solid #3a3a3a',
                  display: 'flex',
                  gap: '4px',
                  alignItems: 'center'
                }}>
                  <span style={{ width: '6px', height: '6px', background: '#6e6a5e', borderRadius: '50%', animation: 'typing 1.4s infinite' }}></span>
                  <span style={{ width: '6px', height: '6px', background: '#6e6a5e', borderRadius: '50%', animation: 'typing 1.4s infinite 0.2s' }}></span>
                  <span style={{ width: '6px', height: '6px', background: '#6e6a5e', borderRadius: '50%', animation: 'typing 1.4s infinite 0.4s' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{
            display: 'flex',
            borderTop: '1px solid #3a3a3a',
            padding: '12px',
            gap: '8px'
          }}>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask me anything..."
              style={{
                flex: 1,
                padding: '10px 14px',
                background: '#1a1a1a',
                border: '1px solid #3a3a3a',
                color: '#f6f1e7',
                fontSize: '13px',
                fontFamily: 'Manrope, sans-serif'
              }}
            />
            <button
              onClick={sendMessage}
              disabled={loading}
              style={{
                padding: '10px 16px',
                background: '#00ff00',
                color: '#0a0a0a',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '12px',
                fontWeight: 700,
                letterSpacing: '.1em',
                textTransform: 'uppercase'
              }}
            >
              Ask
            </button>
          </div>
        </div>
      )}
    </>
  );
}
