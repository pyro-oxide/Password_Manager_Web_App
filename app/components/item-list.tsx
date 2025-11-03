'use client';

import { Globe } from 'lucide-react';
import { useVaultStore } from '../lib/store-db';
import type { PasswordEntry } from '../types';

export function ItemList() {
  const { passwords, selectedPasswordId, selectPassword, searchQuery, selectedCategory, categories } = useVaultStore();
  
  const filteredPasswords = passwords.filter((p) => {
    const matchesSearch = 
      !searchQuery ||
      p.siteName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.username.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getCategoryColor = (categoryName: string) => {
    const category = categories.find((c) => c.name === categoryName);
    return category?.color || 'bg-gray-200 text-gray-800';
  };

  return (
    <div className="flex-1 bg-white overflow-y-auto">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold">Items: {filteredPasswords.length}</h2>
      </div>
      
      <div className="divide-y">
        {filteredPasswords.map((password) => (
          <div
            key={password.id}
            onClick={() => selectPassword(password.id)}
            className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors ${
              selectedPasswordId === password.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
            }`}
          >
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-gray-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 truncate">{password.siteName}</div>
                <div className="text-sm text-gray-600 truncate">{password.username}</div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(password.category)}`}>
                {password.category}
              </span>
            </div>
          </div>
        ))}
        
        {filteredPasswords.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No items found
          </div>
        )}
      </div>
    </div>
  );
}

