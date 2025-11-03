'use client';

import { Search, Settings, LogOut } from 'lucide-react';
import { useVaultStore } from '../lib/store-db';

export function Sidebar({ onSettingsClick }: { onSettingsClick: () => void }) {
  const { searchQuery, setSearchQuery, selectedCategory, setSelectedCategory, categories, passwords, lock } = useVaultStore();
  
  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat.name] = passwords.filter((p) => p.category === cat.name).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="w-64 bg-blue-900 text-white flex flex-col h-full">
      <div className="p-4">
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search Vault"
            value={searchQuery}
            onChange={async (e) => {
              await setSearchQuery(e.target.value);
            }}
            className="w-full pl-10 pr-4 py-2 bg-blue-800 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-2 px-2 py-2 hover:bg-blue-800 rounded cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="text-sm">All Items</span>
            <span className="ml-auto text-xs text-gray-400">({passwords.length})</span>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-semibold uppercase text-gray-400 mb-2 px-2">CATEGORIES</h3>
          <div className="space-y-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={async () => {
                  await setSelectedCategory(selectedCategory === category.name ? null : category.name);
                }}
                className={`w-full flex items-center gap-2 px-2 py-2 rounded text-left hover:bg-blue-800 ${
                  selectedCategory === category.name ? 'bg-blue-800' : ''
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="text-sm flex-1">{category.name}</span>
                <span className="text-xs text-gray-400">({categoryCounts[category.name] || 0})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto p-4 border-t border-blue-800">
        <button
          onClick={onSettingsClick}
          className="flex items-center gap-2 w-full px-2 py-2 hover:bg-blue-800 rounded"
        >
          <Settings className="w-5 h-5" />
          <span className="text-sm">Settings</span>
        </button>
        <button
          onClick={() => {
            if (confirm('Are you sure you want to logout? The vault will be locked.')) {
              lock();
            }
          }}
          className="flex items-center gap-2 w-full px-2 py-2 hover:bg-blue-800 rounded mt-2"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm">Logout</span>
        </button>
        <div className="mt-4 text-xs text-center text-gray-400">Vault Unlocked</div>
      </div>
    </div>
  );
}

