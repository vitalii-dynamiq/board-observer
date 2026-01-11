'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createAttendee, type CreateAttendeeData } from '@/lib/api/meetings';
import { X, User, Mail, Briefcase, Building2 } from 'lucide-react';

interface AttendeeFormProps {
  onClose: () => void;
  onSuccess: (attendee: any) => void;
}

export function AttendeeForm({ onClose, onSuccess }: AttendeeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateAttendeeData>({
    name: '',
    email: '',
    role: '',
    organization: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const attendee = await createAttendee({
        name: formData.name,
        email: formData.email || undefined,
        role: formData.role,
        organization: formData.organization || undefined,
      });

      onSuccess(attendee);
    } catch (err: any) {
      setError(err.message || 'Failed to create attendee');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Add New Attendee</h2>
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
              <User className="mr-1.5 inline-block h-4 w-4" />
              Full Name
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Margaret Thornton"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              <Mail className="mr-1.5 inline-block h-4 w-4" />
              Email Address
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="e.g., m.thornton@company.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              <Briefcase className="mr-1.5 inline-block h-4 w-4" />
              Role / Title
            </label>
            <Input
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="e.g., Board Chair"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              <Building2 className="mr-1.5 inline-block h-4 w-4" />
              Organization / Department
            </label>
            <Input
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              placeholder="e.g., Board of Directors"
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
              {isSubmitting ? 'Creating...' : 'Add Attendee'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
