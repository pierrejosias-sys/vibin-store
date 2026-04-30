'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import styles from '../styles.css';

export default function SupportAgentPage() {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('waiting_for_agent');
  const [agentName, setAgentName] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    checkAuth();
    fetchChats();
  }, [filter]);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = '/login?redirect=/support-agent';
      return;
    }
    // Check if user is admin or support agent
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, full_name')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      alert('Access denied. Support agents only.');
      window.location.href = '/';
      return;
    }
    setAgentName(profile.full_name || 'Agent');
  }

  async function fetchChats() {
    setLoading(true);
    let query = supabase
      .from('support_chats')
      .select(`
        *,
        support_messages (*)
      `)
      .order('updated_at', { ascending: false });

    if (filter !== 'all') {
      query = query.eq('status', filter);
    }

    const { data, error } = await query;
    if (data) {
      setChats(data);
    }
    setLoading(false);
  }

  async function selectChat(chat) {
    setSelectedChat(chat);
    const { data: msgs } = await supabase
      .from('support_messages')
      .select('*')
      .eq('chat_id', chat.id)
      .order('created_at', { ascending: true });

    setMessages(msgs || []);
  }

  async function sendMessage() {
    if (!input.trim() || !selectedChat) return;

    const newMsg = {
      chat_id: selectedChat.id,
      sender: 'agent',
      message: input,
      agent_name: agentName
    };

    const { error } = await supabase
      .from('support_messages')
      .insert([newMsg]);

    if (!error) {
      setMessages([...messages, { ...newMsg, created_at: new Date() }]);
      setInput('');

      // Update chat status to 'in_progress'
      await supabase
        .from('support_chats')
        .update({ status: 'in_progress', updated_at: new Date() })
        .eq('id', selectedChat.id);

      setSelectedChat({ ...selectedChat, status: 'in_progress' });
    }
  }

  async function resolveChat() {
    if (!selectedChat) return;

    await supabase
      .from('support_chats')
      .update({ status: 'resolved', updated_at: new Date() })
      .eq('id', selectedChat.id);

    alert('Chat resolved!');
    setSelectedChat(null);
    fetchChats();
  }

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const statusColors = {
    'open': '#3b82f6',
    'waiting_for_agent': '#ef4444',
    'in_progress': '#f59e0b',
    'resolved': '#10b981',
    'pending_verification': '#8b5cf6'
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: styles }} />

      <nav>
        <a href="/" className="logo">VIBIN</a>
        <div className="nav-links">
          <a href="/shop">Shop</a>
          <a href="/admin">Admin</a>
          <a href="/support-agent" style={{color:'var(--coral)'}}>Support Portal</a>
        </div>
      </nav>

      <div style={{ display: 'flex', height: 'calc(100vh - 80px)', background: 'var(--ink)' }}>
        {/* Sidebar - Chat List */}
        <div style={{ width: '380px', borderRight: '1px solid var(--line)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '20px', borderBottom: '1px solid var(--line)' }}>
            <h2 style={{ fontFamily: 'Anton, sans-serif', fontSize: '24px', textTransform: 'uppercase', marginBottom: '12px' }}>
              Support <em style={{ fontStyle: 'italic', color: 'var(--coral)' }}>Portal</em>
            </h2>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {['all', 'waiting_for_agent', 'in_progress', 'resolved'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    padding: '6px 12px',
                    background: filter === f ? 'var(--coral)' : 'var(--ink2)',
                    color: 'var(--cream)',
                    border: '1px solid var(--line)',
                    cursor: 'pointer',
                    fontSize: '10px',
                    fontFamily: 'JetBrains Mono, monospace',
                    letterSpacing: '.1em',
                    textTransform: 'uppercase'
                  }}
                >
                  {f.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>Loading...</div>
            ) : chats.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--muted)' }}>No chats found</div>
            ) : (
              chats.map(chat => (
                <div
                  key={chat.id}
                  onClick={() => selectChat(chat)}
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--line)',
                    cursor: 'pointer',
                    background: selectedChat?.id === chat.id ? 'var(--ink2)' : 'transparent',
                    transition: 'background .2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{chat.email || 'Guest'}</span>
                    <span style={{
                      padding: '2px 8px',
                      background: statusColors[chat.status] || 'var(--muted)',
                      color: 'var(--cream)',
                      fontSize: '9px',
                      fontFamily: 'JetBrains Mono, monospace',
                      letterSpacing: '.1em',
                      textTransform: 'uppercase'
                    }}>
                      {chat.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
                    {new Date(chat.updated_at).toLocaleString()}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--dim)', marginTop: '4px' }}>
                    {chat.support_messages?.[chat.support_messages.length - 1]?.message?.substring(0, 50) || 'No messages'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {selectedChat ? (
            <>
              <div style={{ padding: '20px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 600 }}>{selectedChat.email || 'Guest User'}</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'JetBrains Mono, monospace' }}>
                    Chat ID: {selectedChat.id.substring(0, 8)}...
                  </div>
                </div>
                <button
                  onClick={resolveChat}
                  style={{
                    padding: '10px 20px',
                    background: 'var(--green)',
                    color: 'var(--cream)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: 'Manrope, sans-serif',
                    letterSpacing: '.1em',
                    textTransform: 'uppercase'
                  }}
                >
                  Mark Resolved ✓
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    style={{
                      marginBottom: '16px',
                      display: 'flex',
                      justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <div style={{
                      maxWidth: '70%',
                      padding: '12px 16px',
                      background: msg.sender === 'user' ? 'var(--coral)' : msg.sender === 'agent' ? 'var(--ink2)' : 'var(--ink3)',
                      color: 'var(--cream)',
                      borderRadius: '8px',
                      fontSize: '13px',
                      lineHeight: '1.6'
                    }}>
                      {msg.sender === 'agent' && (
                        <div style={{ fontSize: '10px', color: 'var(--coral)', marginBottom: '4px', fontFamily: 'JetBrains Mono, monospace' }}>
                          {msg.agent_name || 'Agent'}
                        </div>
                      )}
                      {msg.message.split('\n').map((line, idx) => (
                        <div key={idx}>{line}</div>
                      ))}
                      <div style={{ fontSize: '9px', color: 'var(--muted)', marginTop: '6px', textAlign: 'right' }}>
                        {new Date(msg.created_at).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <div style={{ padding: '20px', borderTop: '1px solid var(--line)', display: 'flex', gap: '12px' }}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your response..."
                  style={{
                    flex: 1,
                    padding: '12px 16px',
                    background: 'var(--ink2)',
                    border: '1px solid var(--line)',
                    color: 'var(--cream)',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                />
                <button
                  onClick={sendMessage}
                  style={{
                    padding: '12px 24px',
                    background: 'var(--coral)',
                    color: 'var(--cream)',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: 700,
                    fontFamily: 'Manrope, sans-serif',
                    letterSpacing: '.1em',
                    textTransform: 'uppercase'
                  }}
                >
                  Send →
                </button>
              </div>
            </>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
                <div style={{ fontSize: '16px' }}>Select a chat to start helping</div>
                <div style={{ fontSize: '12px', marginTop: '8px' }}>
                  {chats.filter(c => c.status === 'waiting_for_agent').length} waiting for agent
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
