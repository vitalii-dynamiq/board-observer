"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CheckCircle2, Clock, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MeetingPhase } from "@/lib/types";

interface MeetingPhasesProps {
  meetingId: string;
  currentPhase: MeetingPhase;
}

const phases = [
  { id: "prepare", label: "Prepare", icon: Clock, path: "prepare" },
  { id: "live", label: "In Meeting", icon: Radio, path: "live" },
  { id: "summary", label: "Summary", icon: CheckCircle2, path: "summary" },
] as const;

export function MeetingPhases({ meetingId, currentPhase }: MeetingPhasesProps) {
  const pathname = usePathname();
  
  const getCurrentIndex = () => {
    if (pathname.includes("/live")) return 1;
    if (pathname.includes("/summary")) return 2;
    return 0;
  };
  
  const currentIndex = getCurrentIndex();

  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2 rounded-lg bg-gray-100/80 p-1">
      {phases.map((phase, index) => {
        const isActive = index === currentIndex;
        const isPast = index < currentIndex;
        const isFuture = index > currentIndex;
        const Icon = phase.icon;

        // Determine if phase is accessible based on meeting state
        const isAccessible = 
          (currentPhase === "upcoming" && index <= 0) ||
          (currentPhase === "live" && index <= 1) ||
          (currentPhase === "completed");

        return (
          <Link
            key={phase.id}
            href={isAccessible ? `/${meetingId}/${phase.path}` : "#"}
            className={cn(
              "flex items-center gap-1.5 sm:gap-2 rounded-md px-2.5 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition-all whitespace-nowrap",
              isActive && "bg-white shadow-sm text-gray-900",
              !isActive && isAccessible && "text-gray-500 hover:text-gray-900 hover:bg-white/50",
              !isAccessible && "text-gray-400 cursor-not-allowed opacity-50"
            )}
            onClick={(e) => !isAccessible && e.preventDefault()}
          >
            <Icon className={cn(
              "h-3.5 w-3.5 sm:h-4 sm:w-4",
              isActive && phase.id === "live" && "text-green-600"
            )} />
            <span className="hidden xs:inline sm:inline">{phase.label}</span>
            <span className="xs:hidden">{phase.label.split(' ')[0]}</span>
          </Link>
        );
      })}
    </div>
  );
}
