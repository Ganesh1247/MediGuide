import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { MessageSquare, X, Send, Sparkles, Volume2, Mic, MicOff, AlertCircle, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:bottom-8 sm:right-8 z-100 flex flex-col items-stretch sm:items-end">
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 70, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 36, scale: 0.96 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="w-full sm:w-[min(100vw-2rem,380px)] h-[68vh] sm:h-155 bg-bg-surface border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] rounded-[24px] sm:rounded-[36px] flex flex-col mb-3 sm:mb-6 overflow-hidden relative border-t-4 sm:border-t-6 border-t-accent backdrop-blur-xl"
          >
            <div className="sm:hidden pt-2 flex justify-center">
              <span className="w-10 h-1 rounded-full bg-white/20" />
            </div>
            {/* Header */}
            <div className="p-3.5 sm:p-5 bg-bg-elevated/50 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl sm:rounded-[20px] bg-accent/10 flex items-center justify-center border border-accent/20 shadow-inner">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
                </div>
                <div>
                  <h3 className="font-display font-black text-base sm:text-lg text-white tracking-tight">Clinical AI</h3>
                  <p className="text-[9px] font-black text-accent uppercase tracking-[0.25em]">MediGuide Synapse v3.0</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} title="Close assistant" aria-label="Close assistant" className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center text-text-dim hover:text-white transition-all cursor-pointer border-none">
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-4 bg-bg-void/10">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  <div className={`p-3 sm:p-4 max-w-[78%] sm:max-w-[72%] rounded-3xl shadow-lg overflow-hidden ${
                    msg.role === "user"
                      ? "bg-accent text-black font-bold rounded-tr-none"
                      : "bg-bg-elevated border border-white/10 text-text-secondary rounded-tl-none"
                  }`}>
                    <div className="max-h-[32vh] overflow-y-auto break-words pr-1">
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                  <span className="text-[8px] font-black text-text-dim uppercase mt-1 px-2">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-4 px-6 py-4 bg-accent/5 rounded-3xl w-fit border border-accent/10">
                  <RefreshCw className="w-5 h-5 text-accent animate-spin" />
                  <span className="text-xs text-accent font-black uppercase tracking-widest">{t("home_inspecting")}...</span>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Suggestions */}
            <div className="px-3 sm:px-5 py-3 flex gap-2 overflow-x-auto no-scrollbar whitespace-nowrap bg-bg-void/50 border-t border-white/10">
              {(suggestionPills[language] || suggestionPills["en"]).map((pill, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(pill)}
                  className="px-4 py-2 bg-bg-surface border border-white/10 rounded-full text-[11px] font-black text-text-dim hover:border-accent hover:text-accent transition-all cursor-pointer whitespace-nowrap"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 sm:p-5 bg-bg-elevated/50 border-t border-white/10 flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleToggleSpeech}
                title={isDictating ? "Stop dictation" : "Start dictation"}
                aria-label={isDictating ? "Stop dictation" : "Start dictation"}
                className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all cursor-pointer ${
                  isDictating ? "bg-red-alert border-red-alert text-white shadow-2xl animate-pulse" : "bg-bg-void border-white/10 text-text-dim hover:text-white"
                }`}
              >
                {isDictating ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={t("nav_vocal_synth") + "..."}
                className="flex-1 bg-bg-void border border-white/10 rounded-[22px] px-3 text-sm text-white font-medium outline-none focus:border-accent transition-all"
              />

              <button
                onClick={() => handleSendMessage()}
                disabled={isLoading || !inputValue.trim()}
                title="Send message"
                aria-label="Send message"
                className="w-12 h-12 rounded-2xl bg-accent text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all border-none shadow-2xl shadow-accent/20 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`self-end w-14 h-14 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[28px] flex items-center justify-center text-black shadow-[0_12px_30px_rgba(34,211,238,0.25)] transition-all transform hover:scale-105 active:scale-95 border-none cursor-pointer ${isOpen ? 'bg-bg-surface text-white' : 'bg-linear-to-br from-accent to-blue'}`}
      >
        {isOpen ? <X className="w-6 h-6 sm:w-8 sm:h-8" /> : <MessageSquare className="w-6 h-6 sm:w-8 sm:h-8" />}
      </button>

    </div>
  );
}
