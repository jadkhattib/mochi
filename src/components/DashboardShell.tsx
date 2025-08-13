"use client";
import ChatBubble from "@/components/ChatBubble";
import { SideNav } from "@/components/Nav";
import { useDashboard } from "@/context/DashboardContext";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { getContext } = useDashboard();
  return (
    <div className="max-w-[1400px] mx-auto px-6 py-8 flex gap-8">
      <SideNav />
      <main className="flex-1 min-w-0">
        <div className="rounded-2xl bg-white/70 backdrop-blur border border-black/10 p-6 shadow-sm">
          {children}
        </div>
      </main>
      <ChatBubble getContext={getContext} />
    </div>
  );
}


