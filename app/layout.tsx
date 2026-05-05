import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Chatbot | Helen Wang",
  description:
    "A general-purpose AI assistant powered by Claude. Built with Next.js, TypeScript, and the Anthropic API.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full font-mono bg-terminal-bg text-terminal-text antialiased">
        {children}
      </body>
    </html>
  );
}