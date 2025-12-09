import React from 'react';

interface DeleteAccountSectionProps {
  onOpenModal: () => void;
}

export default function DeleteAccountSection({ onOpenModal }: DeleteAccountSectionProps) {
  return (
    <section className="bg-white rounded-lg shadow-sm border-2 border-red-200 p-6">
      <h2 className="text-base font-medium text-red-600 mb-2">
        Delete Account
      </h2>
      <p className="text-sm text-gray-700 mb-4">
        This action is permanent and cannot be undone. All of your data, including candidate evaluations and reports, will be permanently erased.
      </p>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={onOpenModal}
          className="px-5 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-md transition-colors"
        >
          Delete My Account
        </button>
      </div>
    </section>
  );
}
