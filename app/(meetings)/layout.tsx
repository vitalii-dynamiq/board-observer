"use client";

import { useState } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { MeetingSidebar } from "@/components/layout/meeting-sidebar";
import { mockMeetings } from "@/lib/mock-data";

export default function MeetingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col">
      <AppHeader onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex flex-1 overflow-hidden">
        <MeetingSidebar
          meetings={mockMeetings}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="flex-1 overflow-auto bg-gray-50/80">
          {children}
        </main>
      </div>
    </div>
  );
}
