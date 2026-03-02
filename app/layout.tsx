import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TopNav } from "@/components/TopNav";
import { siteMeta } from "@/components/seo/metadata";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteMeta.base),
  title: {
    default: "AI 资源站",
    template: "%s | AI 资源站",
  },
  description: "面向 Prompt / MCP / Skill / 教程 的可扩展资源站。",
  openGraph: {
    title: "AI 资源站",
    description: "面向 Prompt / MCP / Skill / 教程 的可扩展资源站。",
    type: "website",
    locale: "zh_CN",
    siteName: "AI 资源站",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <TopNav />
        <main className="mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
