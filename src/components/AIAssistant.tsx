import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { MessageSquare, X, Send, Sparkles, Volume2, Mic, MicOff, AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export default function AIAssistant() {
  const { language, activeLanguage, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDictating, setIsDictating] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestionPills: Record<string, string[]> = {
    en: ["Check symptoms", "Search medications", "Emergency help", "Verify claim"],
    hi: ["लक्षणों की जांच", "दवाएं खोजें", "आपातकालीन मदद", "दावा सत्यापित करें"],
    te: ["లక్షణాలు పరీక్షించండి", "మందులు శోధించండి", "అత్యవసర సహాయం", "నిజానిజాలు సరిచూడండి"]
  };

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{
        id: "greeting",
        role: "assistant",
        content: t("hello_greeting") || "Hello! I am your MediGuide Clinical AI Assistant.",
        timestamp: new Date()
      }]);
    }
  }, [language, messages.length, t]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;
    if (!textToSend) setInputValue("");

    const newUserMessage: ChatMessage = { id: `user-${Date.now()}`, role: "user", content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.slice(-6).map(m => ({ role: m.role, content: m.content })).concat({ role: "user", content: text }),
          language: activeLanguage.englishName
        }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { id: `ai-${Date.now()}`, role: "assistant", content: data.response, timestamp: new Date() }]);
    } catch {
      setMessages((prev) => [...prev, { id: `err-${Date.now()}`, role: "assistant", content: "I'm having trouble connecting. Please try again later.", timestamp: new Date() }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSpeech = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = language === "hi" ? "hi-IN" : language === "te" ? "te-IN" : "en-US";
    recognition.onstart = () => setIsDictating(true);
    recognition.onresult = (e: any) => setInputValue(e.results[0][0].transcript);
    recognition.onend = () => setIsDictating(false);
    recognition.start();
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end">
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.8, rotate: -5 }}
            animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, y: 30, scale: 0.8, rotate: 5 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="w-[90vw] sm:w-[450px] h-[700px] bg-bg-surface border-2 border-white/5 shadow-[0_30px_100px_rgba(0,0,0,0.6)] rounded-[48px] flex flex-col mb-8 overflow-hidden relative border-t-8 border-t-accent backdrop-blur-2xl"
          >
            {/* Header */}
            <div className="p-8 bg-bg-elevated/50 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-[24px] bg-accent/10 flex items-center justify-center border-2 border-accent/20 shadow-inner">
                  <Sparkles className="w-7 h-7 text-accent" />
                </div>
                <div>
                  <h3 className="font-display font-black text-xl text-white tracking-tight">Clinical AI</h3>
                  <p className="text-[10px] font-black text-accent uppercase tracking-[0.25em]">MediGuide Synapse v3.0</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-text-dim hover:text-white transition-all cursor-pointer border-none">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-8 overflow-y-auto space-y-8 bg-bg-void/10">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`p-6 max-w-[85%] rounded-[32px] shadow-xl ${
                    msg.role === "user"
                      ? "bg-accent text-black font-bold rounded-tr-none"
                      : "bg-bg-elevated border border-white/5 text-text-secondary rounded-tl-none"
                  }`}>
                    <p className="text-base leading-relaxed">{msg.content}</p>
                  </div>
                  <span className="text-[9px] font-black text-text-dim uppercase mt-2 px-2">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-4 px-6 py-4 bg-accent/5 rounded-[24px] w-fit border border-accent/10">
                  <RefreshCw className="w-5 h-5 text-accent animate-spin" />
                  <span className="text-xs text-accent font-black uppercase tracking-widest">{t("home_inspecting")}...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            <div className="px-8 py-4 flex gap-3 overflow-x-auto no-scrollbar whitespace-nowrap bg-bg-void/50 border-t border-white/5">
              {(suggestionPills[language] || suggestionPills["en"]).map((pill, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(pill)}
                  className="px-6 py-2.5 bg-bg-surface border-2 border-white/5 rounded-full text-xs font-black text-text-dim hover:border-accent hover:text-accent transition-all cursor-pointer whitespace-nowrap"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-8 bg-bg-elevated/50 border-t border-white/5 flex items-center gap-4">
              <button
                onClick={handleToggleSpeech}
                className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center transition-all cursor-pointer ${
                  isDictating ? "bg-red-alert border-red-alert text-white shadow-2xl animate-pulse" : "bg-bg-void border-white/5 text-text-dim hover:text-white"
                }`}
              >
                {isDictating ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={t("nav_vocal_synth") + "..."}
                className="flex-1 bg-bg-void border-2 border-white/5 rounded-[24px] px-6 h-14 text-base text-white font-medium outline-none focus:border-accent transition-all"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputValue.trim()}
                className="w-14 h-14 rounded-2xl bg-accent text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all border-none shadow-2xl shadow-accent/20 disabled:opacity-50"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-20 h-20 rounded-[32px] flex items-center justify-center text-black shadow-[0_15px_50px_rgba(34,211,238,0.3)] transition-all transform hover:scale-110 active:scale-95 border-none cursor-pointer ${isOpen ? 'bg-bg-surface text-white' : 'bg-gradient-to-br from-accent to-blue'}`}
      >
        {isOpen ? <X className="w-10 h-10" /> : <MessageSquare className="w-10 h-10" />}
      </button>

    </div>
  );
}
