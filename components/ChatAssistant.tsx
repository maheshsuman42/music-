import React, { useState, useRef, useEffect } from 'react';
import { Product, ChatMessage } from '../types';
import { getShopAssistantResponse } from '../services/geminiService';
import { Button } from './Button';

interface ChatAssistantProps {
  products: Product[];
}

export const ChatAssistant: React.FC<ChatAssistantProps> = ({ products }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Hi! I\'m Melody. How can I help you find your perfect instrument today? 🎵' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Convert internal message format to history format for service
    const history = messages.map(m => ({ 
      role: m.role, 
      parts: m.text 
    }));

    const responseText = await getShopAssistantResponse(input, history, products);
    
    setMessages(prev => [...prev, { role: 'model', text: responseText }]);
    setIsLoading(false);
  };

  return (
    <>
      {/* Floating Button */}
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-indigo-500
          ${isOpen ? 'bg-red-500 text-white rotate-45' : 'bg-gradient-to-r from-secondary to-orange-400 text-indigo-900'}`}
      >
        <i className={`fas fa-plus text-xl ${isOpen ? '' : 'hidden'}`}></i>
        <i className={`fas fa-robot text-xl ${isOpen ? 'hidden' : ''}`}></i>
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden max-h-[600px] animate-in slide-in-from-bottom-5 fade-in duration-300">
          <div className="bg-primary p-4 flex items-center">
            <div className="w-10 h-10 rounded-full bg-indigo-800 flex items-center justify-center mr-3">
              <i className="fas fa-robot text-secondary"></i>
            </div>
            <div>
              <h3 className="font-bold text-white">Melody AI</h3>
              <p className="text-xs text-indigo-200">Sales Assistant</p>
            </div>
          </div>

          <div className="flex-grow p-4 overflow-y-auto h-80 bg-gray-50 space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user' 
                      ? 'bg-accent text-white rounded-br-none' 
                      : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-500 p-3 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 text-sm">
                  <i className="fas fa-circle-notch fa-spin mr-2"></i> Thinking...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white border-t border-gray-100">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask about guitars..."
                className="flex-grow border border-gray-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-accent focus:outline-none"
              />
              <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="sm" className="!rounded-lg">
                <i className="fas fa-paper-plane"></i>
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};