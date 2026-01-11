'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createMeeting, updateMeeting, type CreateMeetingData } from '@/lib/api/meetings';
import { X, Calendar, MapPin, Video, Building2 } from 'lucide-react';

interface MeetingFormProps {
  meeting?: {
    id: string;
    title: string;
    type: string;
    scheduledStart: Date | string;
    scheduledEnd: Date | string;
    location?: string;
    isVirtual?: boolean;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function MeetingForm({ meeting, onClose, onSuccess }: MeetingFormProps) {
  const isEditing = !!meeting;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDateForInput = (date: Date | string) => {
    const d = new Date(date);
    return d.toISOString().slice(0, 16);
  };

  const [formData, setFormData] = useState({
    title: meeting?.title || '',
    type: meeting?.type || 'board',
    scheduledStart: meeting?.scheduledStart 
      ? formatDateForInput(meeting.scheduledStart)
      : formatDateForInput(new Date(Date.now() + 24 * 60 * 60 * 1000)),
    scheduledEnd: meeting?.scheduledEnd 
      ? formatDateForInput(meeting.scheduledEnd)
      : formatDateForInput(new Date(Date.now() + 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000)),
    location: meeting?.location || '',
    isVirtual: meeting?.isVirtual ?? false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const data: CreateMeetingData = {
        title: formData.title,
        type: formData.type as CreateMeetingData['type'],
        scheduledStart: new Date(formData.scheduledStart).toISOString(),
        scheduledEnd: new Date(formData.scheduledEnd).toISOString(),
        location: formData.location || undefined,
        isVirtual: formData.isVirtual,
      };

      if (isEditing) {
        await updateMeeting(meeting.id, data);
      } else {
        await createMeeting(data);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save meeting');
    } finally {
      setIsSubmitting(false);
    }
  };

  const meetingTypes = [
    { value: 'board', label: 'Board Meeting' },
    { value: 'committee', label: 'Committee Meeting' },
    { value: 'review', label: 'Review Meeting' },
    { value: 'strategy', label: 'Strategy Session' },
    { value: 'operations', label: 'Operations Meeting' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Meeting' : 'Create New Meeting'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Meeting Title
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Q4 Board of Directors Meeting"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Meeting Type
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
            >
              {meetingTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                <Calendar className="mr-1.5 inline-block h-4 w-4" />
                Start Date & Time
              </label>
              <Input
                type="datetime-local"
                value={formData.scheduledStart}
                onChange={(e) => setFormData({ ...formData, scheduledStart: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                End Date & Time
              </label>
              <Input
                type="datetime-local"
                value={formData.scheduledEnd}
                onChange={(e) => setFormData({ ...formData, scheduledEnd: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              <MapPin className="mr-1.5 inline-block h-4 w-4" />
              Location
            </label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Board Room A - Executive Conference Center"
            />
          </div>

          <div className="flex items-center gap-4 rounded-md border border-gray-200 p-3">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isVirtual: false })}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                !formData.isVirtual
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Building2 className="h-4 w-4" />
              In-Person
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isVirtual: true })}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                formData.isVirtual
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Video className="h-4 w-4" />
              Virtual
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? 'Saving...'
                : isEditing
                ? 'Save Changes'
                : 'Create Meeting'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
