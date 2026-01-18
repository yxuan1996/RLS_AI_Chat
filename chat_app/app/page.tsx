"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function ChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      });
      const data = await response.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.content }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Error connecting to agent." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // 1. Fixed height container (h-screen) with overflow-hidden stops the whole page from scrolling
    <main className="flex h-screen w-full flex-col items-center justify-center bg-zinc-50 p-4 sm:p-8">
      
      {/* 2. Card needs h-full and flex-col to manage its children */}
      <Card className="flex h-full w-full max-w-4xl flex-col overflow-hidden shadow-2xl border-zinc-200">
        
        {/* FIXED HEADER */}
        <header className="border-b bg-white p-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-none">Superstore Analyst</h1>
              <p className="text-xs text-muted-foreground mt-1">Azure OpenAI + Supabase RLS</p>
            </div>
          </div>
        </header>

        {/* SCROLLABLE MESSAGE AREA */}
        {/* flex-1 tells this div to take up all remaining space between header and footer */}
        <div className="flex-1 overflow-hidden relative bg-white">
          <ScrollArea className="h-full w-full">
            <div className="flex flex-col gap-6 p-6">
              {messages.map((m, index) => (
                <div key={index} className={`flex gap-4 ${m.role === "user" ? "flex-row-reverse" : "flex-row"}`}>
                  <Avatar className="h-9 w-9 shrink-0 border">
                    <AvatarFallback className={m.role === "user" ? "bg-zinc-800 text-white" : "bg-primary text-white"}>
                      {m.role === "user" ? <User size={18} /> : <Bot size={18} />}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={`flex flex-col gap-2 max-w-[85%] ${m.role === "user" ? "items-end" : "items-start"}`}>
                    <div className={`rounded-2xl px-4 py-3 text-sm shadow-sm ${
                      m.role === "user" ? "bg-primary text-primary-foreground" : "bg-zinc-100 text-zinc-900"
                    }`}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]} 
                      // className="prose prose-sm dark:prose-invert break-words"
                      >
                        {m.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                 <div className="flex gap-4 animate-in fade-in">
                    <Avatar className="h-9 w-9 shrink-0 border">
                      <AvatarFallback className="bg-primary text-white"><Bot size={18} /></AvatarFallback>
                    </Avatar>
                    <div className="bg-zinc-100 rounded-2xl px-6 py-4 flex items-center">
                      <Loader2 className="h-4 w-4 animate-spin text-zinc-500" />
                    </div>
                 </div>
              )}
              {/* Invisible anchor for auto-scroll */}
              <div ref={scrollRef} className="h-4" />
            </div>
          </ScrollArea>
        </div>

        {/* FIXED FOOTER / CHATBAR */}
        <footer className="border-t bg-white p-4 shrink-0">
          <form onSubmit={handleSubmit} className="flex items-center gap-2 max-w-3xl mx-auto">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about sales, products, or regional performance..."
              className="flex-1 bg-zinc-50 border-zinc-200 focus-visible:ring-primary h-11"
              disabled={isLoading}
            />
            <Button type="submit" size="icon" className="h-11 w-11 shrink-0" disabled={isLoading || !input}>
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </Button>
          </form>
          <p className="text-[10px] text-center text-zinc-400 mt-2">
            Data access restricted by Row Level Security.
          </p>
        </footer>

      </Card>
    </main>
  );
}