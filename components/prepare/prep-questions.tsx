"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Plus,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { PrepQuestion } from "@/lib/types";

interface PrepQuestionsProps {
  questions: PrepQuestion[];
}

const categoryConfig = {
  clarification: { icon: HelpCircle, color: "text-blue-600", bg: "bg-blue-50" },
  risk: { icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  opportunity: { icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
  strategic: { icon: Target, color: "text-purple-600", bg: "bg-purple-50" },
  operational: { icon: Lightbulb, color: "text-amber-600", bg: "bg-amber-50" },
};

const priorityConfig = {
  high: "border-l-red-500 bg-red-50/30",
  medium: "border-l-amber-500 bg-amber-50/30",
  low: "border-l-gray-300 bg-gray-50/30",
};

export function PrepQuestions({ questions }: PrepQuestionsProps) {
  const [newQuestion, setNewQuestion] = useState("");
  const [localQuestions, setLocalQuestions] = useState(questions);

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return;
    
    const question: PrepQuestion = {
      id: `pq-new-${Date.now()}`,
      question: newQuestion.trim(),
      category: "clarification",
      priority: "medium",
      aiGenerated: false,
      answered: false,
    };
    
    setLocalQuestions([...localQuestions, question]);
    setNewQuestion("");
  };

  const toggleAnswered = (id: string) => {
    setLocalQuestions((prev) =>
      prev.map((q) =>
        q.id === id ? { ...q, answered: !q.answered } : q
      )
    );
  };

  const unanswered = localQuestions.filter((q) => !q.answered);
  const answered = localQuestions.filter((q) => q.answered);

  return (
    <div className="rounded-xl border border-gray-200/80 bg-white shadow-card">
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Prep Questions</h2>
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
            {unanswered.length} remaining
          </span>
        </div>
      </div>

      {/* Add question */}
      <div className="border-b border-gray-100 p-4">
        <div className="flex gap-2">
          <Input
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Add a question to ask during the meeting..."
            onKeyDown={(e) => e.key === "Enter" && handleAddQuestion()}
          />
          <Button onClick={handleAddQuestion} disabled={!newQuestion.trim()}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="divide-y divide-gray-100">
        {/* Unanswered questions */}
        {unanswered.map((question) => (
          <QuestionItem
            key={question.id}
            question={question}
            onToggle={() => toggleAnswered(question.id)}
          />
        ))}

        {/* Answered section */}
        {answered.length > 0 && (
          <div className="bg-gray-50/50">
            <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
              Answered ({answered.length})
            </div>
            {answered.map((question) => (
              <QuestionItem
                key={question.id}
                question={question}
                onToggle={() => toggleAnswered(question.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface QuestionItemProps {
  question: PrepQuestion;
  onToggle: () => void;
}

function QuestionItem({ question, onToggle }: QuestionItemProps) {
  const category = categoryConfig[question.category];
  const CategoryIcon = category.icon;

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 border-l-2 transition-colors",
        priorityConfig[question.priority],
        question.answered && "opacity-60"
      )}
    >
      <button
        onClick={onToggle}
        className={cn(
          "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors mt-0.5",
          question.answered
            ? "border-green-500 bg-green-500 text-white"
            : "border-gray-300 hover:border-gray-400"
        )}
      >
        {question.answered && <CheckCircle2 className="h-3 w-3" />}
      </button>
      
      <div className="flex-1 min-w-0">
        <p className={cn(
          "text-sm text-gray-900",
          question.answered && "line-through text-gray-500"
        )}>
          {question.question}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <span className={cn(
            "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium",
            category.bg, category.color
          )}>
            <CategoryIcon className="h-3 w-3" />
            {question.category}
          </span>
          {question.aiGenerated && (
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
              <Sparkles className="h-3 w-3" />
              AI suggested
            </span>
          )}
          <span className={cn(
            "text-xs font-medium",
            question.priority === "high" && "text-red-600",
            question.priority === "medium" && "text-amber-600",
            question.priority === "low" && "text-gray-500"
          )}>
            {question.priority} priority
          </span>
        </div>
      </div>
    </div>
  );
}
