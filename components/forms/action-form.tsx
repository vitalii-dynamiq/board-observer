'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createActionItem, updateActionItem, type CreateActionData } from '@/lib/api/meetings';
import { X, Calendar, User, Flag } from 'lucide-react';

interface ActionFormProps {
  meetingId: string;
  attendees?: { id: string; name: string }[];
  action?: {
    id: string;
    description: string;
    assigneeId?: string;
    dueDate?: string;
    priority: string;
    notes?: string;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export function ActionForm({ meetingId, attendees = [], action, onClose, onSuccess }: ActionFormProps) {
  const isEditing = !!action;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDateForInput = (date?: string) => {
    if (!date) return '';
    return new Date(date).toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    description: action?.description || '',
    assigneeId: action?.assigneeId || '',
    dueDate: formatDateForInput(action?.dueDate),
    priority: action?.priority || 'medium',
    notes: action?.notes || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const data: CreateActionData = {
        description: formData.description,
        assigneeId: formData.assigneeId || undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        priority: formData.priority as 'high' | 'medium' | 'low',
        notes: formData.notes || undefined,
      };

      if (isEditing) {
        await updateActionItem(meetingId, action.id, data);
      } else {
        await createActionItem(meetingId, data);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save action item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const priorities = [
    { value: 'high', label: 'High', color: 'text-red-600' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
    { value: 'low', label: 'Low', color: 'text-gray-600' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            {isEditing ? 'Edit Action Item' : 'Create Action Item'}
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
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What needs to be done?"
              className="h-24 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                <User className="mr-1.5 inline-block h-4 w-4" />
                Assignee
              </label>
              <select
                value={formData.assigneeId}
                onChange={(e) => setFormData({ ...formData, assigneeId: e.target.value })}
                className="h-9 w-full rounded-md border border-gray-200 bg-white px-3 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
              >
                <option value="">Unassigned</option>
                {attendees.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                <Calendar className="mr-1.5 inline-block h-4 w-4" />
                Due Date
              </label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              <Flag className="mr-1.5 inline-block h-4 w-4" />
              Priority
            </label>
            <div className="flex gap-2">
              {priorities.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: p.value })}
                  className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    formData.priority === p.value
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional context..."
              className="h-20 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
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
                : 'Create Action'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
