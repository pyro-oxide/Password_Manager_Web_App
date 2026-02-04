'use client';

import { useEffect, useRef, useState } from 'react';
import { Plus, Edit, Trash2, Lock, Settings } from 'lucide-react';
import { useVaultStore } from '../lib/store-db';
import { Sidebar } from './sidebar';
import { ItemList } from './item-list';
import { DetailsPanel } from './details-panel';
import { PasswordDialog } from './password-dialog';
import { SettingsModal } from './settings-modal';
import { ActivityTracker } from './activity-tracker';
import Alert from './alert';

export function Dashboard() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [alertState, setAlertState] = useState<{ type: 'success' | 'danger'; text: string } | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { selectedPasswordId, passwords, deletePassword, lock, selectPassword } = useVaultStore();

  const selectedPassword = passwords.find((p) => p.id === selectedPasswordId);

  const showAlert = (type: 'success' | 'danger', text: string) => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    setAlertState({ type, text });
    hideTimer.current = setTimeout(() => setAlertState(null), 3000);
  };

  useEffect(() => {
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, []);

  const handleEdit = () => {
    if (selectedPasswordId) {
      setShowEditDialog(true);
    }
  };

  const handleDelete = async () => {
    if (selectedPasswordId && confirm('Are you sure you want to delete this password?')) {
      const success = await deletePassword(selectedPasswordId);
      if (success) {
        selectPassword(null);
        showAlert('success', 'Password deleted');
      } else {
        showAlert('danger', 'Failed to delete password. Please try again.');
      }
    }
  };

  return (
    <>
      <ActivityTracker />
      <div className="flex flex-col h-screen bg-gray-50">
        {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold">Secure Password Manager - v1.0.0</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddDialog(true)}
            className="p-2 hover:bg-gray-100 rounded"
            title="Add"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={handleEdit}
            disabled={!selectedPasswordId}
            className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Edit"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={handleDelete}
            disabled={!selectedPasswordId}
            className="p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Delete"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          <button
            onClick={lock}
            className="flex items-center gap-1 px-3 py-1 border rounded hover:bg-gray-50"
            title="Lock"
          >
            <Lock className="w-4 h-4" />
            <span className="text-sm">Lock</span>
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-gray-100 rounded"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar onSettingsClick={() => setShowSettings(true)} />
        <ItemList />
        <DetailsPanel onEdit={handleEdit} onDelete={handleDelete} />
      </div>

      {/* Dialogs */}
      {showAddDialog && (
        <PasswordDialog
          isOpen={showAddDialog}
          onClose={() => setShowAddDialog(false)}
          onNotify={showAlert}
        />
      )}

      {showEditDialog && selectedPassword && (
        <PasswordDialog
          isOpen={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          onNotify={showAlert}
          password={selectedPassword}
        />
      )}

      {showSettings && (
        <SettingsModal
          isOpen={showSettings}
          onClose={() => setShowSettings(false)}
          onNotify={showAlert}
        />
      )}
      {alertState && <Alert type={alertState.type} text={alertState.text} />}
      </div>
    </>
  );
}

