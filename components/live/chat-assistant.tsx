"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { Send, Sparkles, User, Volume2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ChatMessage, ChatSource } from "@/lib/types";
import { askAdvisorQuestion } from "@/lib/api/meetings";
import { askAgent, onAgentResponse, onAdvisorInsight, onAdvisorSpeaking, getSocket } from "@/lib/api/socket";

interface ChatAssistantProps {
  meetingId?: string;
  initialMessages?: ChatMessage[];
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

/**
 * Chat Assistant Component
 * 
 * @AI-INTEGRATION-POINT
 * This component provides a chat interface for AI-powered meeting assistance.
 * 
 * To integrate with real AI service:
 * 1. Replace the mock response logic in handleSubmit
 * 2. Expected endpoint: POST /agents/chat
 * 3. Input: { meetingId, message, context: { transcript, documents } }
 * 4. Output: { response, sources, confidence, relatedQuestions }
 * 
 * Features to implement:
 * - RAG (Retrieval Augmented Generation) from meeting documents
 * - Context from live transcript
 * - Historical meeting data retrieval
 */
export function ChatAssistant({ meetingId, initialMessages = [] }: ChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  
  // Always use real AI when meetingId is available
  const useRealAI = !!meetingId;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for advisor insights (real AI mode)
  useEffect(() => {
    if (!useRealAI || !meetingId) return;

    const unsubInsight = onAdvisorInsight((insight) => {
      // Add advisor insight as a message
      const insightMessage: ChatMessage = {
        id: `insight-${insight.id}`,
        role: "assistant",
        content: `[${insight.type.toUpperCase()}] ${insight.content}`,
        timestamp: new Date(insight.timestamp),
        confidence: insight.priority === 'high' ? 0.95 : insight.priority === 'medium' ? 0.85 : 0.75,
      };
      setMessages((prev) => [...prev, insightMessage]);
    });

    const unsubSpeaking = onAdvisorSpeaking(() => {
      setIsSpeaking(true);
      setTimeout(() => setIsSpeaking(false), 3000);
    });

    const unsubResponse = onAgentResponse((data) => {
      setIsLoading(false);
      if (data.answer) {
        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: data.answer,
          timestamp: new Date(),
          confidence: 0.9,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else if (data.error) {
        const errorMessage: ChatMessage = {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: `Error: ${data.error}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    });

    return () => {
      unsubInsight();
      unsubSpeaking();
      unsubResponse();
    };
  }, [useRealAI, meetingId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input.trim();
    setInput("");
    setIsLoading(true);

    if (useRealAI && meetingId) {
      // Use real OpenAI integration via WebSocket
      try {
        // First try via WebSocket for real-time response
        askAgent({ meetingId, question: currentInput });
        // Response will come via onAgentResponse listener
      } catch (error) {
        // Fallback to REST API
        try {
          const { answer } = await askAdvisorQuestion(meetingId, currentInput);
          const assistantMessage: ChatMessage = {
            id: `msg-${Date.now() + 1}`,
            role: "assistant",
            content: answer,
            timestamp: new Date(),
            confidence: 0.9,
          };
          setMessages((prev) => [...prev, assistantMessage]);
        } catch (apiError: any) {
          const errorMessage: ChatMessage = {
            id: `msg-${Date.now() + 1}`,
            role: "assistant",
            content: `Sorry, I couldn't process your question. ${apiError.message || 'Please try again.'}`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
        setIsLoading(false);
      }
    } else {
      // Mock response - simulates AI processing
      setTimeout(() => {
        const mockResponses = [
          {
            content: "Based on the current discussion, I can help clarify the financial implications. The proposed budget allocation includes regulatory costs, local hiring, and initial marketing spend. Would you like me to break down the specific allocations?",
            sources: [
              { id: "src-1", type: "transcript" as const, name: "Current transcript" },
              { id: "src-2", type: "document" as const, name: "Budget Proposal" },
            ],
            relatedQuestions: [
              "What are the key risk factors in the expansion plan?",
              "How does this compare to previous initiatives?",
            ],
          },
          {
            content: "Looking at the enterprise risk register, there are three critical risks that have been elevated. The primary concerns relate to cybersecurity threats, supply chain disruptions, and regulatory compliance. I can provide more details on any of these.",
            sources: [
              { id: "src-3", type: "document" as const, name: "Risk Register Q4" },
            ],
            relatedQuestions: [
              "What mitigation strategies are proposed?",
              "How have these risks changed since last quarter?",
            ],
          },
          {
            content: "The digital transformation Phase III request totals $340M over 24 months. Based on Phase I and II performance (102% of savings target achieved), the projected ROI is 2.4x over 5 years with $820M in annual run-rate savings by FY2028.",
            sources: [
              { id: "src-4", type: "document" as const, name: "Digital Transformation Brief" },
              { id: "src-5", type: "transcript" as const, name: "CEO presentation" },
            ],
            relatedQuestions: [
              "What are the key milestones and decision gates?",
              "What workforce impact is expected?",
            ],
          },
        ];

        const responseData = mockResponses[Math.floor(Math.random() * mockResponses.length)];
        
        const assistantMessage: ChatMessage = {
          id: `msg-${Date.now() + 1}`,
          role: "assistant",
          content: responseData.content,
          timestamp: new Date(),
          sources: responseData.sources,
          confidence: 0.85 + Math.random() * 0.14,
          relatedQuestions: responseData.relatedQuestions,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setIsLoading(false);
      }, 1200 + Math.random() * 800);
    }

    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleRelatedQuestion = (question: string) => {
    setInput(question);
    inputRef.current?.focus();
  };

  return (
    <div className="rounded-xl border border-gray-200/80 bg-white shadow-card flex flex-col h-full">
      {/* Header */}
      <div className="border-b border-gray-100 p-4 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className={cn(
            "flex h-8 w-8 items-center justify-center rounded-lg",
            isSpeaking ? "bg-green-600 animate-pulse" : "bg-gray-900"
          )}>
            {isSpeaking ? (
              <Volume2 className="h-4 w-4 text-white" />
            ) : (
              <Sparkles className="h-4 w-4 text-white" />
            )}
          </div>
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              AI Advisor
            </h2>
            <p className="text-xs text-gray-500">
              {isSpeaking ? (
                <span className="text-green-600 font-medium">Speaking in meeting...</span>
              ) : isLoading ? (
                <span className="text-blue-600 font-medium">Thinking...</span>
              ) : (
                "Ask questions about the meeting"
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Sparkles className="mx-auto h-8 w-8 text-gray-300 mb-2" />
            <p className="text-sm">Ask questions about the meeting discussion</p>
            <p className="text-xs text-gray-400 mt-1">I have access to the live transcript and documents</p>
            <div className="mt-4 space-y-2">
              {[
                "What are the key risks discussed?",
                "Summarize the budget proposal",
                "What decisions were made?",
              ].map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleRelatedQuestion(suggestion)}
                  className="block mx-auto text-xs text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={message} 
            onRelatedQuestion={handleRelatedQuestion}
          />
        ))}

        {isLoading && (
          <div className="flex gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-900">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="rounded-2xl bg-gray-100 px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" />
                <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.1s" }} />
                <span className="h-2 w-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-100 p-4 flex-shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about the meeting..."
              rows={1}
              className={cn(
                "w-full resize-none rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 text-sm text-gray-900",
                "placeholder:text-gray-400",
                "focus:border-gray-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900/5",
                "disabled:cursor-not-allowed disabled:opacity-50"
              )}
              disabled={isLoading}
            />
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-[46px] px-4 rounded-xl"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: ChatMessage;
  onRelatedQuestion?: (question: string) => void;
}

function MessageBubble({ message, onRelatedQuestion }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}>
      {!isUser && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gray-900">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
      )}

      <div className={cn("max-w-[85%] space-y-2", isUser && "flex flex-col items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3",
            isUser
              ? "bg-gray-900 text-white"
              : "border border-gray-200/80 bg-white shadow-sm"
          )}
        >
          <p className="text-sm leading-relaxed">{message.content}</p>
        </div>

        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-gray-400">Sources:</span>
            {message.sources.map((source) => (
              <SourceBadge key={source.id} source={source} />
            ))}
            {message.confidence && (
              <span className="text-xs text-gray-400">
                {Math.round(message.confidence * 100)}% confidence
              </span>
            )}
          </div>
        )}

        {!isUser && message.relatedQuestions && message.relatedQuestions.length > 0 && (
          <div className="space-y-1">
            {message.relatedQuestions.map((question, idx) => (
              <button
                key={idx}
                onClick={() => onRelatedQuestion?.(question)}
                className="block text-left text-xs text-blue-600 hover:text-blue-800 hover:underline"
              >
                → {question}
              </button>
            ))}
          </div>
        )}

        <span className="text-xs text-gray-400">
          {formatTime(message.timestamp)}
        </span>
      </div>

      {isUser && (
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gray-100">
          <User className="h-4 w-4 text-gray-600" />
        </div>
      )}
    </div>
  );
}

function SourceBadge({ source }: { source: ChatSource }) {
  const typeColors: Record<string, string> = {
    transcript: "border-green-200 bg-green-50 text-green-700",
    document: "border-blue-200 bg-blue-50 text-blue-700",
    agenda: "border-amber-200 bg-amber-50 text-amber-700",
    external: "border-gray-200 bg-gray-50 text-gray-700",
    insight: "border-purple-200 bg-purple-50 text-purple-700",
  };

  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium",
      typeColors[source.type] || "border-gray-200 bg-white text-gray-600"
    )}>
      {source.name}
    </span>
  );
}
