"use client";
import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";

// Add custom CSS for purple border pulse animation
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes purplePulse {
      0%, 100% { 
        opacity: 0.4; 
        transform: scale(1);
      }
      50% { 
        opacity: 0.8; 
        transform: scale(1.02);
      }
    }
  `;
  document.head.appendChild(style);
}



function formatMarkdown(text: string): string {
  return text
    .replace(/### ([^\n]+)/g, '<h3 class="font-semibold text-sm mb-2 mt-3 first:mt-0">$1</h3>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-medium">$1</strong>')
    .replace(/- ([^\n]+)/g, '<li class="ml-4 list-disc">$1</li>')
    .replace(/(\n|^)([^<\n-][^\n]*)/g, '$1<p class="mb-2">$2</p>')
    .replace(/(<li[^>]*>[^<]*<\/li>(\s*<li[^>]*>[^<]*<\/li>)*)/g, '<ul class="mb-2 space-y-1">$1</ul>')
    .replace(/<p class="mb-2"><\/p>/g, '')
    .trim();
}

type ChatContext = {
  selectedBrand: string | "All";
  startDate: string;
  endDate: string;
  aggregation: "daily" | "weekly";
  selectedChannels: unknown;
  activeChartId?: string;
  charts: Record<string, unknown>;
};

interface ChatBubbleProps {
  getContext: () => ChatContext;
}

export default function ChatBubble({ getContext }: ChatBubbleProps) {
  const [open, setOpen] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);



  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (showMessages) {
          setShowMessages(false);
        } else {
          setOpen(false);
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showMessages]);

  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && messages.length > 0) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  async function send() {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput("");
    const nextMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(nextMessages);
    setShowMessages(true); // Show messages when sending
    setIsTyping(true);
    
    try {
      const context = getContext();
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages, context }),
      });
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.reply ?? "" }]);
    } catch (error) {
      setMessages((m) => [...m, { role: "assistant", content: "Sorry, I encountered an error. Please try again." }]);
    } finally {
      setIsTyping(false);
    }
  }

  return (
    <>
      {/* Glassy AI Button with Glow */}
      <div className="fixed bottom-6 right-6 z-50">
        {/* Glowing Effect - Only show when chat is closed */}
        {!open && (
          <>
            <div className="absolute inset-0 rounded-full border-2 border-purple-500/40 blur-sm" style={{
              animation: 'purplePulse 3s ease-in-out infinite'
            }}></div>
            <div className="absolute inset-0 rounded-full border border-purple-400/30 blur-md" style={{
              animation: 'purplePulse 3s ease-in-out infinite 1.5s'
            }}></div>
          </>
        )}
        
        <button
          title="Ask Mochi AI"
          className="relative bg-white/15 backdrop-blur-2xl backdrop-saturate-200 text-black/80 w-20 h-20 rounded-full border border-purple-400/60 shadow-2xl shadow-purple-400/20 flex items-center justify-center hover:bg-white/25 hover:text-black/90 hover:border-purple-500/70 focus:outline-none transition-all hover:scale-105 duration-300"
          onClick={() => {
            if (!open) {
              setOpen(true);
              setShowMessages(false);
            } else {
              setShowMessages(true);
            }
          }}
        >
          <div className="flex flex-col items-center">
            <span className="text-sm font-medium">Ask</span>
            <span className="text-sm font-medium">Mochi</span>
          </div>
        </button>
      </div>



      {/* Chat Interface */}
      <div
        className={clsx(
          "fixed inset-x-0 bottom-0 z-50 transition-all duration-500 ease-out",
          open ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        )}
      >
        {/* Unified Chat Container - Only show if there are messages and showMessages is true */}
        {messages.length > 0 && showMessages && (
          <div className="max-w-4xl mx-auto px-6 pb-4">
            {/* Unified Glassy Chat Container */}
            <div className="bg-white/15 backdrop-blur-2xl backdrop-saturate-150 rounded-3xl border border-white/20 shadow-2xl p-6 overflow-hidden">
              {/* Close Button */}
              <div className="flex justify-end mb-4">
                <button 
                  onClick={() => setShowMessages(false)} 
                  className="bg-black/20 backdrop-blur-md text-white/80 hover:text-white w-8 h-8 rounded-full hover:bg-black/30 flex items-center justify-center transition-all shadow-lg backdrop-saturate-150"
                >
                  ✕
                </button>
              </div>
              
              {/* Messages Container */}
              <div className="space-y-3 overflow-y-auto max-h-[50vh] font-sans">
                {messages.map((m, i) => (
                  <div key={i} className={clsx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={clsx(
                      "max-w-[85%] rounded-xl px-4 py-3 text-base leading-relaxed",
                      m.role === "user" 
                        ? "bg-black/70 text-white/95 rounded-br-md" 
                        : "bg-white/45 text-black/95 rounded-bl-md"
                    )}>
                      {m.role === "user" ? (
                        <div>{m.content}</div>
                      ) : (
                        <div dangerouslySetInnerHTML={{ __html: formatMarkdown(m.content) }} />
                      )}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-xl px-4 py-3 bg-white/25 text-base rounded-bl-md">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-black/80">Mochi is thinking</span>
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-black/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-black/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-black/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </div>
          </div>
        )}

        {/* Input Section */}
        <div className="max-w-4xl mx-auto px-6 pb-16">
          <div className="relative">
            {/* Pulsing Purple Border Glow - Only show when no messages */}
            {(!showMessages || messages.length === 0) && (
              <>
                <div className="absolute inset-0 rounded-full border-2 border-purple-500/40 blur-sm" style={{
                  animation: 'purplePulse 3s ease-in-out infinite'
                }}></div>
                <div className="absolute inset-0 rounded-full border border-purple-400/30 blur-md" style={{
                  animation: 'purplePulse 3s ease-in-out infinite 1.5s'
                }}></div>
              </>
            )}
            
            {/* Input Container */}
            <div className={clsx(
              "relative backdrop-blur-xl backdrop-saturate-200 rounded-full flex items-center p-2 transition-all duration-700",
              (!showMessages || messages.length === 0) 
                ? "bg-white/20 border border-purple-400/60 shadow-2xl shadow-purple-400/20" 
                : "bg-white/20 border border-white/40 shadow-2xl"
            )}>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onClick={() => setShowMessages(true)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") send();
                }}
                placeholder="Ask Mochi about your data, charts, insights..."
                className="flex-1 px-6 py-4 text-base bg-transparent focus:outline-none placeholder-black/60 text-black/90 font-sans"
                disabled={isTyping}
              />
              <button
                onClick={send}
                disabled={!input.trim() || isTyping}
                className={clsx(
                  "rounded-full text-white text-sm px-6 py-4 transition-all flex items-center gap-2 font-medium",
                  (!input.trim() || isTyping)
                    ? "bg-black/20 cursor-not-allowed" 
                    : "bg-[#2d2d2d] hover:bg-black shadow-md hover:shadow-lg active:scale-95"
                )}
              >
                {isTyping ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Thinking...</span>
                  </>
                ) : (
                  <>
                    <span>Ask</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>


        </div>
      </div>
    </>
  );
}