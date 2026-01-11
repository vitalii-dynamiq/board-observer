'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMeeting } from "@/lib/hooks/use-meetings";
import { getMeetingById } from "@/lib/mock-data";

interface MeetingPageProps {
  params: { id: string };
}

export default function MeetingPage({ params }: MeetingPageProps) {
  const router = useRouter();
  const { meeting: apiMeeting, isLoading, isError } = useMeeting(params.id);
  
  // Fallback to mock data if API fails
  // @AI-INTEGRATION-POINT: Remove mock fallback when backend is always available
  const meeting = apiMeeting || (!isLoading && getMeetingById(params.id));

  useEffect(() => {
    if (isLoading) return;
    
    if (!meeting) {
      router.replace("/");
      return;
    }

    // Redirect based on meeting phase
    switch (meeting.phase) {
      case "live":
        router.replace(`/${params.id}/live`);
        break;
      case "completed":
        router.replace(`/${params.id}/summary`);
        break;
      default:
        router.replace(`/${params.id}/prepare`);
    }
  }, [meeting, isLoading, router, params.id]);

  // Show loading while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin h-8 w-8 border-2 border-gray-300 border-t-gray-900 rounded-full" />
    </div>
  );
}
