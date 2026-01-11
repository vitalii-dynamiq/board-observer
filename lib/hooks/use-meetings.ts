/**
 * React hooks for meeting data fetching with SWR
 */

'use client';

import useSWR, { mutate } from 'swr';
import {
  getMeetings,
  getMeeting,
  getOrganizations,
  getOrganization,
  getOrganizationStats,
  getAttendees,
  getAgendaItems,
  getDocuments,
  getActionItems,
  getDecisions,
  getTranscript,
  getInsights,
  getMeetingSummary,
  getDetectedActions,
  getDetectedDecisions,
} from '../api/meetings';
import type { Meeting, Attendee, AgendaItem, ActionItem, Decision, Organization, OrganizationStats } from '../types';

// SWR options for different data types
const defaultOptions = {
  revalidateOnFocus: false,
  dedupingInterval: 2000,
};

const liveOptions = {
  ...defaultOptions,
  refreshInterval: 5000, // Refresh live data every 5 seconds as fallback
};

// ============================================
// ORGANIZATIONS
// ============================================

export function useOrganizations() {
  const { data, error, isLoading, mutate: mutateOrgs } = useSWR<Organization[]>(
    'organizations',
    () => getOrganizations(),
    defaultOptions
  );

  return {
    organizations: data || [],
    isLoading,
    isError: error,
    mutate: mutateOrgs,
  };
}

export function useOrganization(slug: string | null) {
  const { data, error, isLoading } = useSWR<Organization>(
    slug ? ['organization', slug] : null,
    () => getOrganization(slug!),
    defaultOptions
  );

  return {
    organization: data,
    isLoading,
    isError: error,
  };
}

export function useOrganizationStats(slug: string | null) {
  const { data, error, isLoading } = useSWR<OrganizationStats>(
    slug ? ['organization-stats', slug] : null,
    () => getOrganizationStats(slug!),
    defaultOptions
  );

  return {
    stats: data,
    isLoading,
    isError: error,
  };
}

// ============================================
// MEETINGS
// ============================================

export function useMeetings(filter?: { 
  phase?: string; 
  type?: string; 
  organizationSlug?: string;
  organizationId?: string;
}) {
  const key = filter ? ['meetings', filter] : 'meetings';
  const { data, error, isLoading, mutate: mutateMeetings } = useSWR<Meeting[]>(
    key,
    () => getMeetings(filter),
    defaultOptions
  );

  return {
    meetings: data || [],
    isLoading,
    isError: error,
    mutate: mutateMeetings,
  };
}

export function useMeeting(id: string | null) {
  const { data, error, isLoading, mutate: mutateMeeting } = useSWR<Meeting>(
    id ? ['meeting', id] : null,
    () => getMeeting(id!),
    defaultOptions
  );

  return {
    meeting: data,
    isLoading,
    isError: error,
    mutate: mutateMeeting,
  };
}

// ============================================
// ATTENDEES
// ============================================

export function useAttendees(search?: string) {
  const { data, error, isLoading, mutate: mutateAttendees } = useSWR<Attendee[]>(
    search ? ['attendees', search] : 'attendees',
    () => getAttendees(search),
    defaultOptions
  );

  return {
    attendees: data || [],
    isLoading,
    isError: error,
    mutate: mutateAttendees,
  };
}

// ============================================
// AGENDA
// ============================================

export function useAgendaItems(meetingId: string | null) {
  const { data, error, isLoading, mutate: mutateAgenda } = useSWR<AgendaItem[]>(
    meetingId ? ['agenda', meetingId] : null,
    () => getAgendaItems(meetingId!),
    defaultOptions
  );

  return {
    agendaItems: data || [],
    isLoading,
    isError: error,
    mutate: mutateAgenda,
  };
}

// ============================================
// DOCUMENTS
// ============================================

export function useDocuments(meetingId: string | null) {
  const { data, error, isLoading, mutate: mutateDocuments } = useSWR(
    meetingId ? ['documents', meetingId] : null,
    () => getDocuments(meetingId!),
    defaultOptions
  );

  return {
    documents: data || [],
    isLoading,
    isError: error,
    mutate: mutateDocuments,
  };
}

// ============================================
// ACTIONS
// ============================================

export function useActionItems(meetingId: string | null) {
  const { data, error, isLoading, mutate: mutateActions } = useSWR<ActionItem[]>(
    meetingId ? ['actions', meetingId] : null,
    () => getActionItems(meetingId!),
    defaultOptions
  );

  return {
    actionItems: data || [],
    isLoading,
    isError: error,
    mutate: mutateActions,
  };
}

// ============================================
// DECISIONS
// ============================================

export function useDecisions(meetingId: string | null) {
  const { data, error, isLoading, mutate: mutateDecisions } = useSWR<Decision[]>(
    meetingId ? ['decisions', meetingId] : null,
    () => getDecisions(meetingId!),
    defaultOptions
  );

  return {
    decisions: data || [],
    isLoading,
    isError: error,
    mutate: mutateDecisions,
  };
}

// ============================================
// LIVE MEETING DATA
// ============================================

export function useTranscript(meetingId: string | null, enabled: boolean = true) {
  const { data, error, isLoading, mutate: mutateTranscript } = useSWR(
    meetingId && enabled ? ['transcript', meetingId] : null,
    () => getTranscript(meetingId!, 100),
    liveOptions
  );

  return {
    transcript: data || [],
    isLoading,
    isError: error,
    mutate: mutateTranscript,
  };
}

export function useInsights(meetingId: string | null, enabled: boolean = true) {
  const { data, error, isLoading, mutate: mutateInsights } = useSWR(
    meetingId && enabled ? ['insights', meetingId] : null,
    () => getInsights(meetingId!),
    liveOptions
  );

  return {
    insights: data || [],
    isLoading,
    isError: error,
    mutate: mutateInsights,
  };
}

export function useDetectedActions(meetingId: string | null, enabled: boolean = true) {
  const { data, error, isLoading, mutate: mutateDetected } = useSWR(
    meetingId && enabled ? ['detected-actions', meetingId] : null,
    () => getDetectedActions(meetingId!),
    liveOptions
  );

  return {
    detectedActions: data || [],
    isLoading,
    isError: error,
    mutate: mutateDetected,
  };
}

export function useDetectedDecisions(meetingId: string | null, enabled: boolean = true) {
  const { data, error, isLoading, mutate: mutateDetected } = useSWR(
    meetingId && enabled ? ['detected-decisions', meetingId] : null,
    () => getDetectedDecisions(meetingId!),
    liveOptions
  );

  return {
    detectedDecisions: data || [],
    isLoading,
    isError: error,
    mutate: mutateDetected,
  };
}

// ============================================
// SUMMARY
// ============================================

export function useMeetingSummary(meetingId: string | null) {
  const { data, error, isLoading, mutate: mutateSummary } = useSWR(
    meetingId ? ['summary', meetingId] : null,
    () => getMeetingSummary(meetingId!).catch(() => null),
    defaultOptions
  );

  return {
    summary: data,
    isLoading,
    isError: error,
    mutate: mutateSummary,
  };
}

// ============================================
// GLOBAL REVALIDATION
// ============================================

export function revalidateMeetings() {
  mutate((key) => typeof key === 'string' ? key.includes('meeting') : 
    Array.isArray(key) && key[0]?.includes('meeting'), undefined, { revalidate: true });
}

export function revalidateMeeting(meetingId: string) {
  mutate(['meeting', meetingId]);
  mutate(['agenda', meetingId]);
  mutate(['documents', meetingId]);
  mutate(['actions', meetingId]);
  mutate(['decisions', meetingId]);
}
