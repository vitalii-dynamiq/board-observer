'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createAgendaItem, updateAgendaItem, type CreateAgendaItemData } from '@/lib/api/meetings';
import { X, Clock, User } from 'lucide-react';

interface AgendaFormProps {
  meetingId: string;
  item?: {
    id: string;
    title: string;
    description?: string;
    duration: number;
    presenter?: string;
    order: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function AgendaForm({ meetingId, item, onClose, onSuccess }: AgendaFormProps) {
  const isEditing = !!item;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateAgendaItemData>({
    title: item?.title || '',
    description: item?.description || '',
    duration: item?.duration || 30,
    presenter: item?.presenter || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isEditing) {
        await updateAgendaItem(meetingId, item.id, formData);
      } else {
        await createAgendaItem(meetingId, formData);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save agenda item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const durationOptions = [
    { value: 5, label: '5 minutes' },
    { value: 10, label: '10 minutes' },
    { value: 15, label: '15 minutes' },
    { value: 20, label: '20 minutes' },
    { value: 30, label: '30 minutes' },
    { value: 45, label: '45 minutes' },
    { value: 60, label: '1 hour' },
    { value: 90, label: '1.5 hours' },
    { value: 120, label: '2 hours' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Agenda Item' : 'Add Agenda Item'}
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
              Title
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., CEO Report & Strategic Update"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief description of the agenda item..."
              className="h-24 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                <Clock className="mr-1.5 inline-block h-4 w-4" />
                Duration
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
              >
                {durationOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                <User className="mr-1.5 inline-block h-4 w-4" />
                Presenter
              </label>
              <Input
                value={formData.presenter}
                onChange={(e) => setFormData({ ...formData, presenter: e.target.value })}
                placeholder="e.g., Robert Castellano"
              />
            </div>
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
                : 'Add to Agenda'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
