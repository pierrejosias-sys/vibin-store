'use client'

import { useState, useEffect, useRef } from 'react'
import styles from '../styles.css'

export default function SupporChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { sender: 'bot', message: 'Hey! 🛎 I\'m Vibin Support. How can I help you today?', verified: true }
  ])
  const [input, setInput] = useState('')
  const [chatId, setChatId] = useState(null)
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  async function sendMessage() {
    if (!input.trim()) return

    const userMessage = { sender: 'user', message: input }
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    // Save to Supabase if chat exists
    let currentChatId = chatId
    if (!currentChatId) {
      const { data: chat } = await supabase
        .from('support_chats')
        .insert({ user_id: 'guest', email: 'guest@vibinapparel.com' })
        .select()
        .single()

      if (chat) {
        currentChatId = chat.id
        setChatId(chat.id)
      }
    }

    if (currentChatId) {
      await supabase.from('support_messages').insert([
        { chat_id: currentChatId, sender: 'user', message: input }
      ])
    }

    // Bot response logic
    const botResponse = getBotResponse(input)

    setTimeout(async () => {
      const botMessage = {
        sender: 'bot',
        message: botResponse.text,
        needsVerification: botResponse.needsVerification,
        verified: !botResponse.needsVerification
      }

      setMessages(prev => [...prev, botMessage])
      setLoading(false)

      if (currentChatId) {
        await supabase.from('support_messages').insert([
          {
            chat_id: currentChatId,
            sender: 'bot',
            message: botResponse.text,
            needs_verification: botResponse.needsVerification
          }
        ])

        // If needs verification, create verification request or handoff
        if (botResponse.needsVerification) {
          if (botResponse.requestType === 'human_handoff') {
            // Update chat status to waiting_for_agent
            await supabase
              .from('support_chats')
              .update({ status: 'waiting_for_agent', updated_at: new Date() })
              .eq('id', currentChatId);
          } else {
            await supabase.from('verification_requests').insert([
              {
                chat_id: currentChatId,
                message_id: (await supabase
                  .from('support_messages')
                  .select('id')
                  .eq('chat_id', currentChatId)
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .single()).data?.id,
                requester_email: 'guest@vibinapparel.com',
                request_type: botResponse.requestType || 'other'
              }
            ])
          }
        }
      }
    }, 1000)
  }

  function getBotResponse(userInput) {
    const input = userInput.toLowerCase()

    if (input.includes('refund') || input.includes('return')) {
      return {
        text: 'I can help with your refund request. I\'ll need to verify this with our admin team. They\'ll review and process within 24 hours. Is this okay?',
        needsVerification: true,
        requestType: 'refund'
      }
    }

    if (input.includes('exchange') || input.includes('swap')) {
      return {
        text: 'I can initiate an exchange for you. Let me verify this with our admin team. They\'ll contact you within 24 hours with next steps.',
        needsVerification: true,
        requestType: 'exchange'
      }
    }

    if (input.includes('price') || input.includes('match') || input.includes('cheaper')) {
      return {
        text: 'Found a better price? I can submit a price match request to our admin team. They\'ll review and adjust if eligible.',
        needsVerification: true,
        requestType: 'price_match'
      }
    }

    if (input.includes('order') || input.includes('track') || input.includes('shipping')) {
      return {
        text: 'I can help track your order! Please provide your order number (e.g., ORD-1234567890) and I\'ll look it up for you.'
      }
    }

    if (input.includes('hello') || input.includes('hi') || input.includes('hey')) {
      return {
        text: 'Hey there! 👋 How can I help you today? I can assist with returns, exchanges, order tracking, or price matching.'
      }
    }
    if (input.includes('talk to human') || input.includes('agent') || input.includes('person') || input.includes('support')) {
      return {
        text: 'I\'m transferring you to a support agent. They\'ll be with you shortly. You can also email us directly at returns@vibinapparel.com',
        needsVerification: true,
        requestType: 'human_handoff'
      }
    }
    return {
      text: 'I\'m here to help! I can assist with:\n• Returns & refunds\n• Product exchanges\n• Order tracking\n• Price matching\n\nWhat do you need help with?',
      needsVerification: false
    }
  }

  return (
    <>
      {/* Chat Bubble */}
      <div className="chat-bubble" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '✕' : '💬'}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="chat-header-title">Vibin Support</div>
            <div className="chat-header-sub">We typically reply in a few minutes</div>
            <button className="chat-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>

          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.sender}`}>
                <div className="chat-msg-content">
                  {msg.message.split('\n').map((line, idx) => (
                    <div key={idx}>{line}</div>
                  ))}
                  {msg.needsVerification && (
                    <div className="chat-verification">
                      ⏳ Awaiting admin verification...
                    </div>
                  )}
                  {msg.sender === 'bot' && !msg.needsVerification && (
                    <div className="chat-verified">✓ Verified response</div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-msg bot">
                <div className="chat-msg-content">
                  <div className="chat-typing">
                    <span></span><span></span><span></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-input-area">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Type your message..."
              className="chat-input"
            />
            <button onClick={sendMessage} className="chat-send">Send</button>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        .chat-bubble {
          position: fixed;
          bottom: 24px;
          right: 24px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: var(--coral);
          color: var(--cream);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(255,74,61,.3);
          z-index: 1000;
          border: none;
          transition: transform .2s;
        }
        .chat-bubble:hover { transform: scale(1.1); }
        .chat-window {
          position: fixed;
          bottom: 96px;
          right: 24px;
          width: 380px;
          height: 520px;
          background: var(--cream);
          border: 1px solid var(--line);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          box-shadow: 0 8px 32px rgba(0,0,0,.15);
        }
        @media (max-width: 480px) {
          .chat-window {
            right: 8px;
            width: calc(100vw - 16px);
          }
        }
        .chat-header {
          background: var(--ink);
          color: var(--cream);
          padding: 16px 20px;
          position: relative;
        }
        .chat-header-title { font-family: Anton, sans-serif; font-size: 18px; letter-spacing: .04em; }
        .chat-header-sub { font-size: 11px; color: rgba(246,241,231,.6); margin-top: 2px; }
        .chat-close {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--cream);
          font-size: 18px;
          cursor: pointer;
        }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .chat-msg { display: flex; }
        .chat-msg.user { justify-content: flex-end; }
        .chat-msg-content {
          max-width: 80%;
          padding: 10px 14px;
          font-size: 13px;
          line-height: 1.5;
          font-family: Manrope, sans-serif;
        }
        .chat-msg.user .chat-msg-content {
          background: var(--ink);
          color: var(--cream);
        }
        .chat-msg.bot .chat-msg-content {
          background: var(--cream2);
          color: var(--ink);
          border: 1px solid var(--line);
        }
        .chat-verification {
          font-size: 10px;
          color: var(--muted);
          margin-top: 6px;
          font-family: JetBrains Mono, monospace;
          letter-spacing: .1em;
          text-transform: uppercase;
        }
        .chat-verified {
          font-size: 10px;
          color: var(--coral);
          margin-top: 6px;
          font-family: JetBrains Mono, monospace;
          letter-spacing: .1em;
          text-transform: uppercase;
        }
        .chat-typing { display: flex; gap: 4px; align-items: center; padding: 4px 0; }
        .chat-typing span {
          width: 6px; height: 6px;
          background: var(--muted);
          border-radius: 50%;
          animation: typing 1.4s infinite;
        }
        .chat-typing span:nth-child(2) { animation-delay: .2s; }
        .chat-typing span:nth-child(3) { animation-delay: .4s; }
        @keyframes typing {
          0%, 100% { opacity: .3; }
          50% { opacity: 1; }
        }
        .chat-input-area {
          display: flex;
          border-top: 1px solid var(--line);
          padding: 12px;
          gap: 8px;
        }
        .chat-input {
          flex: 1;
          border: 1px solid var(--line);
          padding: 10px 14px;
          font-size: 13px;
          font-family: Manrope, sans-serif;
          outline: none;
          background: var(--cream);
        }
        .chat-input:focus { border-color: var(--ink); }
        .chat-send {
          background: var(--ink);
          color: var(--cream);
          border: none;
          padding: 10px 16px;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: .1em;
          text-transform: uppercase;
          cursor: pointer;
          font-family: Manrope, sans-serif;
        }
        .chat-send:hover { background: var(--coral); }
      ` }} />
    </>
  )
}

import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://grbwnjnngzcsjlubcmtp.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdyYnduam5uZ3pjc2psdWJjbXRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczNTgzMDEsImV4cCI6MjA5MjkzNDMwMX0.SYKFZJ0XVua0JmZ-tkaNhec2M3KtG3tS5vj_1Nl261c'
)
