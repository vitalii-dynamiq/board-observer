'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createDecision, type CreateDecisionData } from '@/lib/api/meetings';
import { X, Vote, Check, XCircle, MinusCircle } from 'lucide-react';

interface DecisionFormProps {
  meetingId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function DecisionForm({ meetingId, onClose, onSuccess }: DecisionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateDecisionData>({
    description: '',
    rationale: '',
    votedFor: 0,
    votedAgainst: 0,
    abstained: 0,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await createDecision(meetingId, {
        description: formData.description,
        rationale: formData.rationale || undefined,
        votedFor: formData.votedFor,
        votedAgainst: formData.votedAgainst,
        abstained: formData.abstained,
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to record decision');
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalVotes = (formData.votedFor || 0) + (formData.votedAgainst || 0) + (formData.abstained || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Record Decision
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
              Decision Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="What was decided?"
              className="h-24 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
              required
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Rationale (Optional)
            </label>
            <textarea
              value={formData.rationale}
              onChange={(e) => setFormData({ ...formData, rationale: e.target.value })}
              placeholder="Why was this decision made?"
              className="h-20 w-full rounded-md border border-gray-200 px-3 py-2 text-sm focus:border-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400"
            />
          </div>

          <div>
            <label className="mb-3 block text-sm font-medium text-gray-700">
              <Vote className="mr-1.5 inline-block h-4 w-4" />
              Voting Results
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-green-700">
                  <Check className="h-3.5 w-3.5" />
                  In Favor
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.votedFor}
                  onChange={(e) => setFormData({ ...formData, votedFor: parseInt(e.target.value) || 0 })}
                  className="border-green-200 bg-white text-center"
                />
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-red-700">
                  <XCircle className="h-3.5 w-3.5" />
                  Against
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.votedAgainst}
                  onChange={(e) => setFormData({ ...formData, votedAgainst: parseInt(e.target.value) || 0 })}
                  className="border-red-200 bg-white text-center"
                />
              </div>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-600">
                  <MinusCircle className="h-3.5 w-3.5" />
                  Abstained
                </label>
                <Input
                  type="number"
                  min="0"
                  value={formData.abstained}
                  onChange={(e) => setFormData({ ...formData, abstained: parseInt(e.target.value) || 0 })}
                  className="border-gray-200 bg-white text-center"
                />
              </div>
            </div>
            {totalVotes > 0 && (
              <p className="mt-2 text-center text-xs text-gray-500">
                Total votes: {totalVotes}
              </p>
            )}
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
              {isSubmitting ? 'Recording...' : 'Record Decision'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
