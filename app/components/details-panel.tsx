'use client';

import { Globe, Eye, EyeOff, Copy, ExternalLink, Edit, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useVaultStore } from '../lib/store-db';
import { copyToClipboardWithAutoClear } from '../lib/clipboard-manager';

export function DetailsPanel({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const { passwords, selectedPasswordId, settings } = useVaultStore();
  const [showPassword, setShowPassword] = useState(false);
  
  const password = passwords.find((p) => p.id === selectedPasswordId);

  const copyToClipboard = (text: string) => {
    copyToClipboardWithAutoClear(text, settings.clearClipboardSeconds || 30);
  };

  if (!password) {
    return (
      <div className="w-96 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-gray-200 rounded-full">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <p className="text-gray-500">Select an item to view details</p>
        </div>
      </div>
    );
  }

  const strengthColors = {
    'Very Weak': 'text-red-600',
    'Weak': 'text-orange-600',
    'Fair': 'text-yellow-600',
    'Good': 'text-blue-600',
    'Strong': 'text-green-600',
  };

  return (
    <div className="w-96 bg-white border-l overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Globe className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold">{password.siteName}</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Username</label>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex-1 text-gray-900">{password.username}</span>
              <button
                onClick={() => copyToClipboard(password.username)}
                className="p-1 hover:bg-gray-100 rounded"
                title="Copy"
              >
                <Copy className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Password</label>
            <div className="mt-1">
              <div className="flex items-center gap-2">
                <span className="flex-1 text-gray-900 font-mono">
                  {showPassword ? password.password : '•'.repeat(16)}
                </span>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 hover:bg-gray-100 rounded"
                  title={showPassword ? 'Hide' : 'Show'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4 text-gray-600" />
                  ) : (
                    <Eye className="w-4 h-4 text-gray-600" />
                  )}
                </button>
                <button
                  onClick={() => copyToClipboard(password.password)}
                  className="p-1 hover:bg-gray-100 rounded"
                  title="Copy"
                >
                  <Copy className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              {password.strength && (
                <p className={`text-sm mt-1 ${strengthColors[password.strength]}`}>
                  Strength: {password.strength}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Website</label>
            <div className="flex items-center gap-2 mt-1">
              <span className="flex-1 text-gray-900">{password.websiteUrl || 'N/A'}</span>
              {password.websiteUrl && (
                <>
                  <a
                    href={`https://${password.websiteUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Open"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-600" />
                  </a>
                  <button
                    onClick={() => copyToClipboard(password.websiteUrl)}
                    className="p-1 hover:bg-gray-100 rounded"
                    title="Copy"
                  >
                    <Copy className="w-4 h-4 text-gray-600" />
                  </button>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">Category</label>
            <p className="mt-1 text-gray-900">{password.category}</p>
          </div>

          {password.notes && (
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">Notes</label>
              <p className="mt-1 text-gray-900 whitespace-pre-wrap">{password.notes}</p>
            </div>
          )}

          <div className="pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Created</label>
                <p className="mt-1 text-gray-900">
                  {new Date(password.createdAt).toLocaleString()}
                </p>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Updated</label>
                <p className="mt-1 text-gray-900">
                  {new Date(password.updatedAt).toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2 mt-6 pt-6 border-t">
          <button
            onClick={onEdit}
            className="flex items-center gap-2 px-4 py-2 border rounded hover:bg-gray-50"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

