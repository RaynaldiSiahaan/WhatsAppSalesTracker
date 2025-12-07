import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { aiService } from '@/services/aiService';
import { Send, User, Bot, Loader2, Lightbulb, TrendingUp, Camera, Tag, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const AIChat: React.FC = () => {
  const { t } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMessage: ChatMessage = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Prepare context from previous messages
      const context = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const res = await aiService.chat(userMessage.content, context);
      
      if (res.success) {
        const aiMessage: ChatMessage = { role: 'assistant', content: res.data };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        // Handle error (e.g., show a system message or alert)
        alert(res.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chat error:', error);
      alert('An error occurred while sending the message.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    e?.preventDefault();
    sendMessage(input);
  };

  const quickActions = [
    { text: t.quickAction1, icon: <TrendingUp className="w-4 h-4" /> }, // Cara promosi di Instagram
    { text: t.quickAction2, icon: <Lightbulb className="w-4 h-4" /> }, // Tips jualan laris
    { text: t.quickAction3, icon: <Bot className="w-4 h-4" /> },       // Ide produk UMKM
    { text: t.quickAction4, icon: <Tag className="w-4 h-4" /> },       // Strategi harga produk
    { text: t.quickAction5, icon: <FileText className="w-4 h-4" /> },  // Cara buat caption menarik
    { text: t.quickAction6, icon: <Camera className="w-4 h-4" /> },    // Tips foto produk
  ];

  return (
    <div className="flex flex-col h-full bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b px-6 py-4 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Bot className="w-6 h-6 text-blue-600" />
          {t.aiChatTitle}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          {t.aiChatDescription}
        </p>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-4">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-teal-400 rounded-full flex items-center justify-center mb-6 shadow-lg">
              <Bot className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{t.aiChatTitle}</h2>
            <p className="text-gray-600 text-center mb-8 max-w-md">
              {t.aiChatDescription}
            </p>
            
            <div className="w-full max-w-2xl">
              <p className="text-sm font-semibold text-gray-500 mb-3 uppercase tracking-wide">Coba tanyakan:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {quickActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => sendMessage(action.text)}
                    className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all text-left group"
                  >
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                      {action.icon}
                    </div>
                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">
                      {action.text}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg, index) => (
          <div
            key={index}
            className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`flex max-w-[80%] md:max-w-[70%] ${
                msg.role === 'user' 
                  ? 'flex-row-reverse' 
                  : 'flex-row'
              } gap-3`}
            >
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0
                ${msg.role === 'user' ? 'bg-blue-100 text-blue-600' : 'bg-white border text-gray-600'}
              `}>
                {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
              </div>
              
              <div className={`
                p-4 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap
                ${msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white text-gray-800 border border-gray-100 rounded-tl-none'}
              `}>
                {msg.role === 'assistant' ? <ReactMarkdown>{msg.content}</ReactMarkdown> : msg.content}
              </div>
            </div>
          </div>
        )))}
        
        {isLoading && (
          <div className="flex w-full justify-start">
             <div className="flex max-w-[80%] flex-row gap-3">
                <div className="w-8 h-8 rounded-full bg-white border text-gray-600 flex items-center justify-center flex-shrink-0">
                   <Bot className="w-5 h-5" />
                </div>
                <div className="bg-white p-4 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center">
                   <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                   <span className="ml-2 text-sm text-gray-500">Thinking...</span>
                </div>
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="bg-white border-t p-4">
        <div className="max-w-4xl mx-auto relative">
          <form 
            onSubmit={handleSend}
            className="relative flex items-end gap-2 bg-gray-50 p-2 rounded-xl border focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-all"
          >
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={t.aiChatPlaceholder}
              className="w-full bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[44px] py-2.5 px-2 text-gray-900 placeholder-gray-400"
              rows={1}
              style={{ height: 'auto', minHeight: '44px' }}
              // Simple auto-grow script can be added here or via a lib, keeping it simple for now
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mb-0.5"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </form>
          <p className="text-xs text-center text-gray-400 mt-2">
            AI can make mistakes. Review generated ideas before use.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AIChat;
