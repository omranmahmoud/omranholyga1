import React from 'react';

interface RateFormActionsProps {
  onCancel: () => void;
  loading: boolean;
  isEdit: boolean;
}

export function RateFormActions({ onCancel, loading, isEdit }: RateFormActionsProps) {
  return (
    <div className="flex justify-end gap-4 pt-6">
      <button
        type="button"
        onClick={onCancel}
        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
      >
        Cancel
      </button>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
      >
        {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
      </button>
    </div>
  );
}
