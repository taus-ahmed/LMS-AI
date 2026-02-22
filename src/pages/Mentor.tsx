import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Send,
  Bot,
  User,
  Bell,
  MessageSquare,
  Lightbulb,
  ThumbsUp,
  Sparkles,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useStudentStore } from '../store/studentStore';
import { getMentorResponse } from '../services/aiService';
import type { ChatMessage } from '../types/student';
import clsx from 'clsx';

const quickPrompts = [
  { label: 'Clarify requirements', icon: MessageSquare, prompt: 'Can you help me understand the project requirements better?' },
  { label: 'Milestone guidance', icon: Bell, prompt: 'What should I focus on for the current milestone?' },
  { label: 'Concept help', icon: Lightbulb, prompt: 'I need help understanding PID control tuning for my project.' },
  { label: 'Review my approach', icon: ThumbsUp, prompt: 'I want to discuss my sensor selection approach and get your feedback.' },
];

export default function Mentor() {
  const student = useStudentStore((s) => s.student);
  const addMessage = useStudentStore((s) => s.addMessage);
  const isMentorTyping = useStudentStore((s) => s.isMentorTyping);
  const setIsMentorTyping = useStudentStore((s) => s.setIsMentorTyping);
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [student.chatHistory, isMentorTyping]);

  // Build conversation history for Groq context
  const buildConversationHistory = useCallback(() => {
    return student.chatHistory
      .filter((msg) => msg.role === 'student' || msg.role === 'mentor')
      .map((msg) => ({
        role: msg.role === 'student' ? 'user' as const : 'assistant' as const,
        content: msg.content,
      }));
  }, [student.chatHistory]);

  const handleSend = useCallback(
    async (text?: string) => {
      const message = text || inputValue.trim();
      if (!message || isMentorTyping) return;

      setError(null);
      addMessage({ role: 'student', content: message, type: 'text' });
      setInputValue('');
      setIsMentorTyping(true);

      try {
        const conversationHistory = buildConversationHistory();
        const response = await getMentorResponse(student, message, conversationHistory);
        addMessage({ role: 'mentor', content: response, type: 'text' });
      } catch (err) {
        console.error('Mentor response error:', err);
        setError('Failed to get AI response. Please try again.');
        addMessage({
          role: 'mentor',
          content:
            "I'm having trouble connecting right now. This could be a temporary network issue. Please try sending your message again in a moment.",
          type: 'text',
        });
      } finally {
        setIsMentorTyping(false);
      }
    },
    [inputValue, isMentorTyping, student, addMessage, setIsMentorTyping, buildConversationHistory]
  );

  const getMessageIcon = (msg: ChatMessage) => {
    if (msg.type === 'reminder') return Bell;
    if (msg.type === 'feedback') return ThumbsUp;
    if (msg.type === 'reflection') return Lightbulb;
    return msg.role === 'mentor' ? Bot : User;
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Mentor header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2
              className="text-lg font-semibold text-slate-900"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              AI Project Mentor
            </h2>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-slate-500">
                Powered by Llama 3 70B · Groq Inference
              </span>
            </div>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" />
          Personalized for {student.courseCode}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm"
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-rose-500 hover:text-rose-700 text-xs font-medium"
          >
            Dismiss
          </button>
        </motion.div>
      )}

      {/* Chat messages */}
      <div className="flex-1 overflow-y-auto chat-scroll rounded-2xl bg-white border border-slate-100 shadow-sm p-4 sm:p-5 space-y-4">
        {student.chatHistory.map((msg) => {
          const Icon = getMessageIcon(msg);
          const isMentor = msg.role === 'mentor';

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={clsx(
                'flex gap-3',
                isMentor ? 'items-start' : 'items-start flex-row-reverse'
              )}
            >
              <div
                className={clsx(
                  'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0',
                  {
                    'bg-gradient-to-br from-indigo-500 to-purple-600 text-white': isMentor,
                    'bg-gradient-to-br from-amber-400 to-orange-500 text-white': !isMentor,
                  }
                )}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div
                className={clsx('max-w-[80%] space-y-1', isMentor ? '' : 'text-right')}
              >
                <div
                  className={clsx(
                    'inline-block rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    {
                      'bg-slate-50 text-slate-800 rounded-tl-md': isMentor,
                      'bg-indigo-600 text-white rounded-tr-md': !isMentor,
                    }
                  )}
                >
                  {msg.content.split('\n').map((line, i) => (
                    <span key={i}>
                      {line
                        .replace(/\*\*(.*?)\*\*/g, '«$1»')
                        .split('«')
                        .map((part, j) => {
                          if (part.includes('»')) {
                            const [bold, rest] = part.split('»');
                            return (
                              <span key={j}>
                                <strong>{bold}</strong>
                                {rest}
                              </span>
                            );
                          }
                          return <span key={j}>{part}</span>;
                        })}
                      {i < msg.content.split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </div>
                {msg.type && msg.type !== 'text' && isMentor && (
                  <div className="flex items-center gap-1.5">
                    <span
                      className={clsx(
                        'text-[10px] font-medium uppercase tracking-wide px-2 py-0.5 rounded-full',
                        {
                          'bg-amber-50 text-amber-600': msg.type === 'reminder',
                          'bg-emerald-50 text-emerald-600': msg.type === 'feedback',
                          'bg-purple-50 text-purple-600': msg.type === 'reflection',
                        }
                      )}
                    >
                      {msg.type}
                    </span>
                  </div>
                )}
                <p
                  className={clsx(
                    'text-[10px] text-slate-400',
                    isMentor ? '' : 'text-right'
                  )}
                >
                  {new Date(msg.timestamp).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </motion.div>
          );
        })}

        {/* Typing indicator */}
        {isMentorTyping && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-3"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-slate-50 rounded-2xl rounded-tl-md px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
              <span className="text-xs text-slate-500">AI is thinking...</span>
            </div>
          </motion.div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick prompts */}
      <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
        {quickPrompts.map((qp, i) => (
          <button
            key={i}
            onClick={() => handleSend(qp.prompt)}
            disabled={isMentorTyping}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 font-medium transition-all whitespace-nowrap flex-shrink-0',
              isMentorTyping
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700'
            )}
          >
            <qp.icon className="w-3.5 h-3.5" />
            {qp.label}
          </button>
        ))}
      </div>

      {/* Input area */}
      <div className="mt-2 flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={
              isMentorTyping ? 'AI is responding...' : 'Ask your mentor anything...'
            }
            disabled={isMentorTyping}
            className="w-full px-4 py-3 pr-12 rounded-xl bg-white border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-300 transition-all disabled:opacity-60"
          />
        </div>
        <button
          onClick={() => handleSend()}
          disabled={!inputValue.trim() || isMentorTyping}
          className={clsx(
            'w-11 h-11 rounded-xl flex items-center justify-center transition-all',
            inputValue.trim() && !isMentorTyping
              ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-500/20'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          )}
        >
          {isMentorTyping ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
}
