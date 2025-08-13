import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { DashboardProvider } from "@/context/DashboardContext";
import DashboardShell from "@/components/DashboardShell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Brand MMM Dashboard",
  description: "Holding group dashboard with MMM and marketing insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <DashboardProvider>
          <div className="min-h-screen" style={{ backgroundColor: "#f3f2ef", color: "#2d2d2d" }}>
            <DashboardShell>{children}</DashboardShell>
          </div>
        </DashboardProvider>
      </body>
    </html>
  );
}
