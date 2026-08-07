"use client"

import { useState, useRef, useEffect } from "react"
import { GlassCard } from "@/components/ui/glass-card"
import { GlassInput } from "@/components/ui/glass-input"
import { GlassButton } from "@/components/ui/glass-button"
import { GlassChip } from "@/components/ui/glass-chip"
import { Send, ArrowLeft, Bot, User, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { apiClient } from "@/lib/apiClient"

type Message = {
  id: string
  role: "user" | "ai"
  content: string
}

const suggestedPrompts = [
  "Summarize this chapter",
  "Explain the core concept",
  "Generate a practice question",
  "Give me a real-world example"
]

export default function ChatbotPage() {
  const params = useParams()
  const courseId = params.id as string
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      content: "Hi! I'm your AI tutor for this course. I can help explain concepts, summarize chapters, or generate practice questions. What would you like to know?"
    }
  ])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  const handleSend = async (text: string = input) => {
    if (!text.trim()) return

    // Add user message
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsTyping(true)
    setError(null)

    try {
      const result = await apiClient.sendChatMessage(courseId, text)
      const aiMsg: Message = { 
        id: (Date.now() + 1).toString(), 
        role: "ai", 
        content: result.response 
      }
      setMessages(prev => [...prev, aiMsg])
    } catch (err: any) {
      setError(err.message || "Failed to get a response from the AI tutor.")
      // Optional: pop the user message off if it failed, or just show error
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] relative max-w-5xl mx-auto w-full p-4 md:p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/course/${courseId}`}>
          <button className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground hover:text-white hover:bg-white/10 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </button>
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white">Course Tutor AI</h1>
          <p className="text-sm text-muted-foreground">Ask anything about the course material</p>
        </div>
      </div>

      <GlassCard className="flex-1 flex flex-col overflow-hidden p-0 mb-4 border border-white/10 shadow-2xl">
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
            >
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' 
                  ? 'bg-white/10 text-white' 
                  : 'bg-primary/20 text-primary border border-primary/30'
              }`}>
                {msg.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
              </div>
              
              <div className={`p-4 rounded-2xl text-sm whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-white/10 text-white rounded-tr-sm border border-white/5'
                  : 'bg-primary/10 text-white/90 rounded-tl-sm border border-primary/20 backdrop-blur-md shadow-[0_0_15px_rgba(99,102,241,0.1)]'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex gap-4 max-w-[85%]">
              <div className="h-8 w-8 rounded-full flex items-center justify-center shrink-0 bg-primary/20 text-primary border border-primary/30">
                <Bot className="h-4 w-4" />
              </div>
              <div className="p-4 rounded-2xl rounded-tl-sm bg-primary/10 border border-primary/20 flex gap-1.5 items-center">
                <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" />
                <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.2s' }} />
                <span className="h-2 w-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-lg mx-auto max-w-sm mt-4">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span className="text-xs">{error}</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-background/50 backdrop-blur-xl border-t border-white/10">
          <div className="flex flex-wrap gap-2 mb-4 overflow-x-auto pb-1 hide-scrollbar">
            {suggestedPrompts.map((prompt, i) => (
              <GlassChip 
                key={i} 
                className="cursor-pointer whitespace-nowrap text-xs py-1.5"
                onClick={() => handleSend(prompt)}
              >
                {prompt}
              </GlassChip>
            ))}
          </div>
          
          <form 
            className="flex gap-2 relative"
            onSubmit={(e) => {
              e.preventDefault()
              handleSend()
            }}
          >
            <GlassInput 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about the course..." 
              className="flex-1 pr-12 rounded-full h-12 bg-white/5 border-white/10"
              disabled={isTyping}
            />
            <button 
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square rounded-full bg-primary flex items-center justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary-light transition-colors shadow-[0_0_15px_rgba(99,102,241,0.3)]"
            >
              <Send className="h-4 w-4 ml-0.5" />
            </button>
          </form>
        </div>
      </GlassCard>
    </div>
  )
}
