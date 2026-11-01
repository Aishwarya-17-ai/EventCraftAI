/**
 * EventCraft AI - Chat Assistant Tab ("Ask the Planner")
 * Follow-up dialogue with event context, suggested question chips,
 * Enter to send, Shift+Enter for newline, aria-live="polite" log.
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { ChatMessage, EventFormData } from '../lib/types';
import { sendPlannerChat } from '../lib/ai';

interface ChatTabProps {
  eventContext: EventFormData;
}

const SUGGESTED_CHIPS = [
  'How can I lower my catering cost without hurting quality?',
  'What questions should I ask when touring venues?',
  'How many months before should I mail out invitations?',
  'Can you suggest a backup plan in case of rain?',
  'What is the recommended tip or gratuity for wedding vendors?',
];

export const ChatTab: React.FC<ChatTabProps> = ({ eventContext }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      content: `Hello! I am your EventCraft AI planner for "${eventContext.name || 'your upcoming event'}". How can I assist with your budget, timeline, vendor negotiations, or creative touches today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isSending]);

  const handleSendMessage = async (textToSend?: string) => {
    const content = (textToSend !== undefined ? textToSend : inputText).trim();
    if (!content || isSending) return;

    const userMessage: ChatMessage = {
      id: `usr_${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [...messages, userMessage];
    setMessages(updated);
    setInputText('');
    setIsSending(true);

    try {
      const replyText = await sendPlannerChat(updated, eventContext);
      const modelMessage: ChatMessage = {
        id: `mod_${Date.now()}`,
        role: 'model',
        content: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, modelMessage]);
    } catch {
      const fallbackMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'model',
        content: 'I had trouble connecting to the network, but you can continue editing your budget, timeline, and vendor checklists seamlessly.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <section
      role="tabpanel"
      id="panel-chat"
      aria-labelledby="tab-chat"
      className="card"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '620px',
        maxHeight: 'calc(100dvh - 200px)',
        padding: '0',
        overflow: 'hidden',
      }}
    >
      {/* Chat Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>
              Ask the Planner
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
              Context-aware advisor for {eventContext.name || 'your event'}
            </p>
          </div>
        </div>
        <span
          style={{
            fontSize: '0.75rem',
            padding: '3px 8px',
            borderRadius: '999px',
            backgroundColor: 'var(--bg)',
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
          }}
        >
          Active Context: {eventContext.eventType}
        </span>
      </div>

      {/* Suggested Questions Chips */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--bg)',
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
        aria-label="Suggested Questions"
      >
        {SUGGESTED_CHIPS.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(chip)}
            disabled={isSending}
            style={{
              padding: '6px 12px',
              borderRadius: '999px',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--text)',
              fontSize: '0.78rem',
              fontWeight: 500,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              flexShrink: 0,
            }}
          >
            <Sparkles className="w-3 h-3 text-accent" />
            <span>{chip}</span>
          </button>
        ))}
      </div>

      {/* Messages Stream with role="log" and aria-live="polite" */}
      <div
        role="log"
        aria-live="polite"
        aria-atomic="false"
        style={{
          flex: 1,
          padding: '16px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              style={{
                display: 'flex',
                gap: '10px',
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '85%',
                flexDirection: isUser ? 'row-reverse' : 'row',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  backgroundColor: isUser ? 'var(--btn)' : 'var(--primary)',
                  color: '#FFFFFF',
                }}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                style={{
                  backgroundColor: isUser ? 'var(--primary-light)' : 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '12px 16px',
                  color: 'var(--text)',
                }}
              >
                {/* SAFE: Rendered strictly as text, never innerHTML */}
                <p style={{ whiteSpace: 'pre-wrap', fontSize: '0.92rem', lineHeight: 1.5, margin: 0 }}>
                  {m.content}
                </p>
                <span
                  style={{
                    display: 'block',
                    textAlign: isUser ? 'right' : 'left',
                    fontSize: '0.7rem',
                    color: 'var(--text-muted)',
                    marginTop: '4px',
                  }}
                >
                  {m.timestamp}
                </span>
              </div>
            </div>
          );
        })}

        {isSending && (
          <div style={{ display: 'flex', gap: '10px', alignSelf: 'flex-start', maxWidth: '85%' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--primary)',
                color: '#FFF',
              }}
            >
              <Bot className="w-4 h-4" />
            </div>
            <div
              style={{
                backgroundColor: 'var(--bg)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                border: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
              }}
            >
              <span className="animate-spin">✨</span>
              <span>EventCraft AI is thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box Pinned to Bottom */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        className="chat-input-container"
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-end',
        }}
      >
        <textarea
          ref={textareaRef}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question... (Enter to send, Shift+Enter for new line)"
          rows={1}
          style={{
            flex: 1,
            maxHeight: '120px',
            resize: 'none',
            fontSize: '0.925rem',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            border: '1.5px solid var(--border)',
            backgroundColor: 'var(--surface)',
            color: 'var(--text)',
          }}
          disabled={isSending}
          aria-label="Ask the event planner a question"
        />
        <button
          type="submit"
          className="btn-primary"
          style={{ height: '44px', width: '44px', padding: 0 }}
          disabled={!inputText.trim() || isSending}
          aria-label="Send message to planner"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </section>
  );
};
