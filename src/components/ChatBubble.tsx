"use client";
import { useEffect, useRef, useState } from "react";
import { clsx } from "clsx";

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
  const panelRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Auto-scroll to bottom when messages change or typing state changes
  useEffect(() => {
    if (messagesEndRef.current && open) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, open]);

  async function send() {
    const text = input.trim();
    if (!text || isTyping) return;
    setInput("");
    const nextMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(nextMessages);
    setIsTyping(true);
    
    // Immediate scroll after adding user message
    setTimeout(() => {
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 50);
    
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
      <button
        title="Ask AI"
        className="fixed bottom-4 right-4 z-40 rounded-full shadow-lg border border-black/10 bg-[#2d2d2d] text-white w-14 h-14 flex items-center justify-center hover:opacity-90 focus:outline-none"
        onClick={() => setOpen((v) => !v)}
      >
        AI
      </button>
      <div
        ref={panelRef}
        className={clsx(
          "fixed bottom-24 right-4 z-40 w-[min(420px,calc(100vw-2rem))] max-h-[65vh] rounded-xl border border-black/10 bg-[#f3f2ef] shadow-xl overflow-hidden transition-all",
          open ? "opacity-100 translate-y-0" : "opacity-0 pointer-events-none translate-y-4"
        )}
      >
        <div className="p-3 bg-[#2d2d2d] text-white flex items-center justify-between">
          <span className="text-sm font-medium">Mochi • Brand Intelligence</span>
          <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white">✕</button>
        </div>
        <div className="p-3 space-y-3 overflow-y-auto max-h-[50vh]">
          {messages.length === 0 && (
            <p className="text-xs text-black/70">
              Ask about the chart on screen, ROI vs spend, seasonality, flighting, channel contribution, halo, and more.
            </p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={clsx("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div className={clsx(
                "max-w-[85%] rounded-lg px-3 py-2 text-sm",
                m.role === "user" 
                  ? "bg-[#2d2d2d] text-white rounded-br-sm" 
                  : "bg-white/70 text-black/90 rounded-bl-sm"
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
              <div className="max-w-[85%] rounded-lg px-3 py-2 bg-white/70 text-sm rounded-bl-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-black/60">Mochi is typing</span>
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-black/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-black/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-black/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* Scroll target for auto-scroll */}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-3 border-t border-black/10 flex gap-2 items-center">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") send();
            }}
            placeholder="Ask about the current view..."
            className="flex-1 rounded-md border border-black/10 bg-white px-3 py-2 text-sm focus:outline-none"
          />
          <button
            onClick={send}
            disabled={isTyping}
            className={clsx(
              "rounded-md text-white text-sm px-3 py-2 transition-all",
              isTyping 
                ? "bg-black/30 cursor-not-allowed" 
                : "bg-[#2d2d2d] hover:opacity-90"
            )}
          >
            {isTyping ? "..." : "Send"}
          </button>
        </div>
      </div>
    </>
  );
}


