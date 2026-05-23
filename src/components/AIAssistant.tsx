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
  const { language, activeLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDictating, setIsDictating] = useState(false);
  const [speechActiveId, setSpeechActiveId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const suggestionPills: Record<string, string[]> = {
    en: [
      "Triage stomach pain",
      "Explain Paracetamol limits",
      "What is CDSCO clearance?",
      "Is cold shower good for health?",
    ],
    hi: [
      "पेट दर्द का ट्राइएज कें",
      "पैरासिटामॉल की अधिकतम सीमा",
      "CDSCO कानून क्या है?",
      "क्या ठंडे पानी से नहाना सही है?",
    ],
    es: [
      "Triar dolor de estómago",
      "Límites de Paracetamol",
      "¿Qué es la aprobación CDSCO?",
      "Ducha fría y salud",
    ],
    ar: [
      "فرز ألم في البطن",
      "حدود الباراسيتامول الآمنة",
      "ما هو معيار CDSCO؟",
      "فائدة الاستحمام بالماء البارد",
    ],
    vi: [
      "Phân loại đau dạ dày",
      "Giới hạn sử dụng Paracetamol",
      "Chứng nhận CDSCO là gì?",
      "Tắm nước lạnh có tốt không?",
    ],
    ta: [
      "வயிற்று வலி சோதனை",
      "பாரசிட்டமால் அளவு வரம்புகள்",
      "CDSCO சான்றிதழ் என்றால் என்ன?",
      "குளிர்ந்த நீர் குளியல் நன்மையா?",
    ],
  };

  const getAssistantGreeting = (lang: string): string => {
    switch (lang) {
      case "hi":
        return "नमस्ते! मैं आपका मेडिगाइड क्लिनिकल एआई कोपायलट हूं। मैं आज आपकी स्वास्थ्य संबंधी जानकारी या लक्षणों को समझने में कैसे मदद कर सकता हूं?";
      case "es":
        return "¡Hola! Soy su Copiloto Clínico de IA de MediGuide. ¿Cómo puedo ayudarle hoy con información de salud o comprensión de sus síntomas?";
      case "ar":
        return "مرحباً! أنا مساعدك السريري الذكي من MediGuide. كيف يمكنني مساعدتك اليوم في فهم الأعراض أو تقديم الإرشاد الصحي المعتمد؟";
      case "vi":
        return "Xin chào! Tôi là Trợ lý Lâm sàng AI của MediGuide. Tôi có thể hỗ trợ gì cho bạn hôm nay về thông tin sức khỏe hay phân tích triệu chứng?";
      case "ta":
        return "வணக்கம்! நான் உங்கள் மெடிகைடு மருத்துவ ஏஐ உதவியாளர். இன்று உங்கள் ஆரோக்கியம் அல்லது அறிகுறிகளைப் புரிந்து கொள்ள நான் எவ்வாறு உதவ முடியும்?";
      default:
        return "Hello! I am your MediGuide Clinical AI Copilot. How can I assist you today with health information, first aid guidelines, or understanding symptoms?";
    }
  };

  // Add initial greeting on first render or language toggle
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: "greeting",
          role: "assistant",
          content: getAssistantGreeting(language),
          timestamp: new Date(),
        },
      ]);
    }
  }, [language, messages.length]);

  // Scroll to bottom on updates
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    if (!textToSend) {
      setInputValue("");
    }

    const newUserMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);

    try {
      // Build history payload for server endpoint
      const historyContext = messages.slice(-8).map((msg) => ({
        role: msg.role,
        content: msg.content,
      }));
      historyContext.push({ role: "user", content: text });

      const response = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: historyContext,
          language: activeLanguage.englishName,
        }),
      });

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: "assistant",
        content: data.response || "No response received. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI Assistant network error:", error);
      const errMessage: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content: `Error connecting to MediGuide server. Showing cached guidance: For sudden acute symptoms, please consult physical medical centers immediately.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Safe client-side markdown to HTML renderer
  const renderFormattedText = (rawText: string) => {
    const lines = rawText.split("\n");
    return lines.map((line, idx) => {
      let content = line;
      let displayClass = "text-xs leading-relaxed mb-1.5";

      // Match headings
      if (content.startsWith("### ")) {
        return <h4 key={idx} className="text-xs font-bold font-orbitron text-teal-glow uppercase mt-3 mb-1">{content.replace("### ", "")}</h4>;
      }
      if (content.startsWith("## ")) {
        return <h3 key={idx} className="text-sm font-bold font-orbitron text-text-primary uppercase mt-4 mb-1.5">{content.replace("## ", "")}</h3>;
      }

      // Match warning blocks
      if (content.includes("🚨") || content.includes("WARNING:") || content.includes("HIGH ALARM")) {
        displayClass = "text-xs font-semibold leading-relaxed text-red-alert bg-red-alert/5 border-l-2 border-red-alert pl-2 py-1 my-2 rounded-r-md";
      }

      // Parse bold **text**
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastLastIndex = 0;
      let match;

      while ((match = boldRegex.exec(content)) !== null) {
        if (match.index > lastLastIndex) {
          parts.push(content.substring(lastLastIndex, match.index));
        }
        parts.push(<strong key={match.index} className="font-semibold text-text-primary">{match[1]}</strong>);
        lastLastIndex = boldRegex.lastIndex;
      }
      if (lastLastIndex < content.length) {
        parts.push(content.substring(lastLastIndex));
      }

      const finalContent = parts.length > 0 ? parts : content;

      // Handle standard bulletins
      if (content.trim().startsWith("- ") || content.trim().startsWith("* ")) {
        const itemContent = typeof finalContent === "string" ? finalContent.trim().substring(2) : finalContent;
        return (
          <li key={idx} className="list-disc ml-4 text-xs leading-relaxed mb-1 text-text-secondary select-text">
            {itemContent}
          </li>
        );
      }

      // Bullet lists numbers
      if (/^\d+\.\s/.test(content.trim())) {
        const cleaned = typeof finalContent === "string" ? finalContent.trim().replace(/^\d+\.\s/, "") : finalContent;
        const num = content.trim().match(/^\d+/)?.[0] || "1";
        return (
          <div key={idx} className="flex gap-1.5 ml-2 text-xs leading-relaxed mb-1 select-text">
            <span className="font-mono text-[10px] text-teal-glow">{num}.</span>
            <span className="text-text-secondary">{cleaned}</span>
          </div>
        );
      }

      return (
        <p key={idx} className={`${displayClass} select-text text-text-secondary`}>
          {finalContent}
        </p>
      );
    });
  };

  // Text-to-Speech implementation using standard Web Speech Synthesis API
  const handleToggleSpeech = (msgId: string, text: string) => {
    // Check if speaking right now
    if (speechActiveId === msgId) {
      window.speechSynthesis.cancel();
      setSpeechActiveId(null);
      return;
    }

    window.speechSynthesis.cancel(); // Stop anything else first
    const cleanText = text.replace(/[*#🚨_-]/g, " ").substring(0, 300); // Speak first 300 characters safely
    const utterance = new SpeechSynthesisUtterance(cleanText);
    
    // Map text voice locale
    if (language === "hi") utterance.lang = "hi-IN";
    else if (language === "es") utterance.lang = "es-ES";
    else if (language === "ar") utterance.lang = "ar-SA";
    else if (language === "vi") utterance.lang = "vi-VN";
    else if (language === "ta") utterance.lang = "ta-IN";
    else utterance.lang = "en-US";

    utterance.rate = 0.95;

    utterance.onend = () => {
      setSpeechActiveId(null);
    };

    utterance.onerror = () => {
      setSpeechActiveId(null);
    };

    setSpeechActiveId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Speech-to-text dictation simulation/implementation using Web Speech API
  const handleToggleSpeechInput = () => {
    if (isDictating) {
      setIsDictating(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      // Fallback if not supported
      setInputValue(language === "hi" ? "मुझे पेट दर्द है" : "I have stomach ache");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    // Set localization
    if (language === "hi") recognition.lang = "hi-IN";
    else if (language === "es") recognition.lang = "es-ES";
    else if (language === "ar") recognition.lang = "ar-SA";
    else if (language === "vi") recognition.lang = "vi-VN";
    else if (language === "ta") recognition.lang = "ta-IN";
    else recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsDictating(true);
    };

    recognition.onresult = (e: any) => {
      const transcriptStr = e.results[0][0].transcript;
      setInputValue(transcriptStr);
    };

    recognition.onerror = () => {
      setIsDictating(false);
    };

    recognition.onend = () => {
      setIsDictating(false);
    };

    recognition.start();
  };

  const currentSuggestions = suggestionPills[language] || suggestionPills["en"];

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      
      {/* Expanded Dialog Box */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className={`w-[90vw] sm:w-[380px] h-[520px] bg-white border border-border-dim shadow-[0_12px_36px_rgba(0,0,0,0.15)] rounded-2xl flex flex-col mb-4 overflow-hidden relative border-t-4 border-t-teal-glow`}
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-bg-surface/50 to-teal-glow/5 border-b border-border-dim/20 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-glow/10 border border-teal-glow/30 flex items-center justify-center animate-pulse">
                  <Sparkles className="w-4 h-4 text-teal-glow" />
                </div>
                <div>
                  <h3 className="font-orbitron font-bold text-xs uppercase text-text-primary tracking-wide flex items-center gap-1.5">
                    Wellness Co-Pilot
                  </h3>
                  <p className="text-[9px] font-mono text-[#0ea5e9]">
                    Gemini 3.5 Real-time Synapse
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  window.speechSynthesis.cancel();
                  setSpeechActiveId(null);
                  setIsOpen(false);
                }}
                className="w-7 h-7 rounded-lg border border-border-dim/50 hover:bg-bg-surface/50 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5 text-text-secondary" />
              </button>
            </div>

            {/* Warning Banner */}
            <div className="bg-amber-warn/5 border-b border-amber-warn/10 px-4 py-2 flex items-start gap-1.5 text-[10px] text-text-secondary leading-snug">
              <AlertCircle className="w-3.5 h-3.5 text-amber-warn shrink-0 mt-0.5" />
              <span>
                Educational clinical AI guidance only. Dial local dispatches for emergency acute trauma signs.
              </span>
            </div>

            {/* Chat Body */}
            <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-bg-void/10">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="font-orbitron text-[9px] tracking-wider uppercase text-text-dim">
                      {msg.role === "user" ? "Patient" : "MediGuide AI"}
                    </span>
                    <span className="text-[8px] text-text-dim">
                      {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <div
                    className={`p-3 max-w-[85%] rounded-2xl relative border ${
                      msg.role === "user"
                        ? "bg-teal-glow text-white rounded-tr-none border-teal-glow/25"
                        : "bg-bg-surface border-border-dim rounded-tl-none"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <p className="text-xs leading-relaxed select-text font-sans font-medium">{msg.content}</p>
                    ) : (
                      <div className="space-y-0.5">
                        {renderFormattedText(msg.content)}
                      </div>
                    )}

                    {/* Speech Player Trigger */}
                    {msg.role === "assistant" && msg.id !== "greeting" && (
                      <button
                        onClick={() => handleToggleSpeech(msg.id, msg.content)}
                        className={`absolute -bottom-2.5 right-2 w-6 h-6 rounded-full border bg-white flex items-center justify-center shadow-sm cursor-pointer hover:scale-105 transition-transform ${
                          speechActiveId === msg.id 
                            ? "border-teal-glow text-teal-glow animate-pulse" 
                            : "border-border-dim text-text-secondary hover:text-text-primary"
                        }`}
                        title="Voice output text-to-speech"
                      >
                        <Volume2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex flex-col items-start">
                  <span className="font-orbitron text-[9px] uppercase text-text-dim mb-1">MediGuide Synapse</span>
                  <div className="bg-bg-surface border border-border-dim/50 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 text-teal-glow animate-spin" />
                    <span className="text-[10px] font-mono text-text-secondary">Synthesizing diagnostics...</span>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Suggestion Pills */}
            <div className="px-4 py-2 border-t border-border-dim/15 flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth whitespace-nowrap bg-bg-surface/30">
              {currentSuggestions.map((pill, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(pill)}
                  className="px-2.5 py-1 text-[10px] bg-bg-surface/70 border border-border-dim hover:border-teal-glow/30 hover:bg-teal-glow/5 text-text-secondary hover:text-text-primary rounded-full transition-all cursor-pointer select-none"
                >
                  {pill}
                </button>
              ))}
            </div>

            {/* Chat Input Footer */}
            <div className="p-3 bg-bg-surface border-t border-border-dim flex items-center gap-2">
              <button
                onClick={handleToggleSpeechInput}
                className={`w-9 h-9 shrink-0 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                  isDictating
                    ? "bg-red-alert/10 border-red-alert text-red-alert animate-pulse"
                    : "bg-bg-surface border-border-dim text-text-secondary hover:text-text-primary"
                }`}
                title={isDictating ? "Listening..." : "Dictate symptom statement"}
              >
                {isDictating ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder={
                  language === "hi"
                    ? "लक्षण लिखें..."
                    : language === "es"
                    ? "Describir síntoma..."
                    : language === "ar"
                    ? "اكتب العرض الطبي..."
                    : "Describe advice or symptom..."
                }
                className="flex-1 min-w-0 bg-bg-void/10 border border-border-dim hover:border-border-glow/50 focus:border-teal-glow focus:outline-none rounded-xl px-3 py-2 text-xs text-text-primary placeholder:text-text-dim h-9"
              />

              <button
                onClick={() => handleSendMessage()}
                className="w-9 h-9 shrink-0 rounded-xl bg-teal-glow hover:bg-teal-glow/95 text-white flex items-center justify-center shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all border-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Circle Glowing Launcher Trigger Button */}
      <button
        id="copilot-launcher-button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full flex items-center justify-center text-white transition-all cursor-pointer ${
          isOpen 
            ? "bg-bg-surface border border-border-dim hover:border-border-glow shadow-md" 
            : "bg-gradient-to-tr from-teal-glow to-blue-electric shadow-[0_4px_16px_rgba(8,145,178,0.35)] hover:shadow-[0_6px_20px_rgba(8,145,178,0.45)] hover:scale-[1.05]"
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-text-secondary" />
        ) : (
          <div className="relative flex items-center justify-center">
            <MessageSquare className="w-6 h-6" />
            <span className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-red-alert rounded-full border-2 border-white animate-pulse" />
          </div>
        )}
      </button>

    </div>
  );
}
