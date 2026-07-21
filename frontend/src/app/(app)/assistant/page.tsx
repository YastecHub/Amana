'use client';

import { useState, useRef, useEffect } from 'react';
import { Bot, Send, User } from 'lucide-react';
import { assistant } from '@/lib/api';

type Message = { role: 'user' | 'ai'; content: string };

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'ai', content: "Hello! I'm your Amana Cooperative AI Assistant. Ask me anything about your members, loans, or the cooperative's health." }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    const userMsg = text.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      // Mock AI response
      await new Promise(r => setTimeout(r, 1500));
      let answer = "I found that information for you. The data shows everything is operating normally.";
      if (userMsg.toLowerCase().includes('aminu')) {
        answer = "Aminu Kano has a credit score of 85 (Band A). They have a total savings of ₦150,000 and 1 active loan. Their repayment history is excellent.";
      } else if (userMsg.toLowerCase().includes('highest')) {
        answer = "The members with the highest scores currently are Aminu Kano (85) and Sarah Johnson (82).";
      } else if (userMsg.toLowerCase().includes('pending')) {
        answer = "There are currently 4 pending loan requests totaling ₦250,000. Would you like me to summarize them?";
      }

      setMessages(prev => [...prev, { role: 'ai', content: answer }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', content: "Sorry, I couldn't process that request right now." }]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    "How is Aminu performing?",
    "Which members have the highest scores?",
    "Show me pending loan requests"
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col space-y-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">AI Assistant</h1>
        <p className="text-gray-500 mt-1">Ask anything about your cooperative</p>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[80%] ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${m.role === 'user' ? 'bg-gray-200 text-gray-600 ml-3' : 'bg-brand-100 text-brand-600 mr-3'}`}>
                  {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`px-4 py-3 rounded-2xl text-sm ${m.role === 'user' ? 'bg-gray-900 text-white rounded-tr-none' : 'bg-gray-100 text-gray-800 rounded-tl-none leading-relaxed'}`}>
                  {m.content}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="flex flex-row max-w-[80%]">
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-brand-100 text-brand-600 mr-3">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="px-4 py-3 rounded-2xl text-sm bg-gray-100 text-gray-800 rounded-tl-none flex space-x-1 items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50/50">
          <div className="flex flex-wrap gap-2 mb-4">
            {suggestions.map((s, i) => (
              <button 
                key={i} onClick={() => handleSend(s)}
                className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-full text-xs font-medium hover:border-brand-300 hover:text-brand-600 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
          <form onSubmit={e => { e.preventDefault(); handleSend(input); }} className="flex space-x-2">
            <input
              type="text" value={input} onChange={e => setInput(e.target.value)}
              placeholder="Ask a question..."
              className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all text-sm"
            />
            <button 
              type="submit" disabled={!input.trim() || loading}
              className="bg-brand-600 hover:bg-brand-700 text-white px-5 py-3 rounded-lg flex items-center justify-center transition-colors disabled:opacity-70"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
