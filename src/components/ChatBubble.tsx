"use client";
import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";

// Add custom CSS for the rotating border animation
const style = {
  '@keyframes rotate': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' }
  }
};

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
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Add custom CSS for rotation
  useEffect(() => {
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
      @keyframes rotate {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(styleSheet);
    return () => document.head.removeChild(styleSheet);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

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
      {/* AI Button */}
      <button
        title="Ask Mochi AI"
        className="fixed bottom-6 right-6 z-50 rounded-full shadow-lg border border-black/10 bg-[#2d2d2d] text-white w-16 h-16 flex items-center justify-center hover:opacity-90 focus:outline-none transition-all hover:scale-105"
        onClick={() => setOpen(true)}
      >
        <div className="flex flex-col items-center">
          <span className="text-xs font-medium">AI</span>
          <span className="text-[10px] opacity-80">Mochi</span>
        </div>
      </button>

      {/* Overlay */}
      {open && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 transition-all duration-300"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Chat Interface */}
      <div
        className={clsx(
          "fixed inset-x-0 bottom-0 z-50 transition-all duration-500 ease-out",
          open ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 pointer-events-none"
        )}
      >
        {/* Messages Container - Only show if there are messages */}
        {messages.length > 0 && (
          <div className="max-w-4xl mx-auto px-6 pb-4">
            <div className="bg-white/95 backdrop-blur-lg rounded-t-2xl border border-black/10 shadow-2xl max-h-[60vh] overflow-hidden">
              <div className="p-4 border-b border-black/10 bg-[#2d2d2d] text-white rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                      <span className="text-xs font-medium">AI</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">Mochi</h3>
                      <p className="text-xs text-white/70">Brand Intelligence Assistant</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setOpen(false)} 
                    className="text-white/80 hover:text-white w-8 h-8 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>
              
              <div className="p-4 space-y-4 overflow-y-auto max-h-[45vh]">
                {messages.map((m, i) => (
                  <div key={i} className={clsx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={clsx(
                      "max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                      m.role === "user" 
                        ? "bg-[#2d2d2d] text-white rounded-br-md" 
                        : "bg-gray-50 text-black/90 rounded-bl-md border border-black/5"
                    )}>
                      {m.role === "user" ? (
                        <div className="leading-relaxed">{m.content}</div>
                      ) : (
                        <div className="leading-relaxed" dangerouslySetInnerHTML={{ __html: formatMarkdown(m.content) }} />
                      )}
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-gray-50 text-sm rounded-bl-md border border-black/5 shadow-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-black/60">Mochi is thinking</span>
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-[#2d2d2d]/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-[#2d2d2d]/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-[#2d2d2d]/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
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
        <div className="max-w-4xl mx-auto px-6 pb-8">
          <div className="relative">
            {/* Input Container with Illuminating Border */}
            <div className="relative">
              {/* Animated Border Light */}
              <div className="absolute inset-0 rounded-full">
                <div 
                  className="absolute w-full h-full rounded-full"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 270deg, #3b82f6 360deg)',
                    animation: 'rotate 2s linear infinite',
                    padding: '2px'
                  }}
                >
                  <div className="w-full h-full rounded-full bg-white"></div>
                </div>
              </div>
              
              {/* Main Input */}
              <div className="relative bg-white rounded-full shadow-2xl border-2 border-blue-200/50 flex items-center p-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") send();
                  }}
                  placeholder="Ask Mochi about your data, charts, insights..."
                  className="flex-1 px-6 py-4 text-base bg-transparent focus:outline-none placeholder-black/40"
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Hint text - only show when no messages */}
            {messages.length === 0 && (
              <div className="text-center mt-4">
                <p className="text-sm text-white/80 bg-black/20 rounded-full px-4 py-2 inline-block">
                  Ask about ROI trends, channel performance, seasonal insights, or any data on screen
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}