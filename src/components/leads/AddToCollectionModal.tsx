'use client';

import { useState, useEffect } from 'react';
import { X, FolderPlus, Save } from 'lucide-react';
import { getUserCollections, createCollection, addLeadsToCollection } from '@/lib/actions/collections';

interface Collection {
  id: string;
  name: string;
  created_at: string;
}

interface AddToCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCompanyIds: string[];
  selectedCompanies: Array<{ id: string; name: string }>;
  onSuccess?: () => void;
}

export default function AddToCollectionModal({
  isOpen,
  onClose,
  selectedCompanyIds,
  selectedCompanies,
  onSuccess,
}: AddToCollectionModalProps) {
  const [mode, setMode] = useState<'select' | 'create'>('select');
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Fetch collections when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCollections();
      setMode('select');
      setSelectedCollectionId('');
      setNewCollectionName('');
      setError('');
    }
  }, [isOpen]);

  const loadCollections = async () => {
    try {
      setIsLoading(true);
      const data = await getUserCollections();
      setCollections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load collections');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError('');

      let collectionId = selectedCollectionId;

      // If creating new collection
      if (mode === 'create') {
        if (!newCollectionName.trim()) {
          setError('Collection name is required');
          return;
        }

        const newCollection = await createCollection(newCollectionName.trim());
        collectionId = newCollection.id;
      }

      // Validate collection selection
      if (!collectionId) {
        setError('Please select a collection');
        return;
      }

      // Add companies to collection
      const result = await addLeadsToCollection(collectionId, selectedCompanyIds);

      // Show success message
      if (result.inserted > 0) {
        alert(`Successfully added ${result.inserted} compan${result.inserted === 1 ? 'y' : 'ies'} to the collection!`);
      }
      if (result.duplicates > 0) {
        console.log(`${result.duplicates} companies were already in the collection`);
      }

      // Close modal and refresh
      onClose();
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save to collection');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Save to Collection
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {/* Selected companies summary */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {selectedCompanyIds.length} compan{selectedCompanyIds.length === 1 ? 'y' : 'ies'} selected
            </p>
            <div className="mt-2 max-h-24 overflow-y-auto">
              <ul className="text-sm text-gray-800 space-y-1">
                {selectedCompanies.map((company) => (
                  <li key={company.id} className="truncate">
                    • {company.name}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Mode selection */}
          <div className="mb-4">
            <div className="flex gap-4">
              <button
                onClick={() => setMode('select')}
                className={`flex-1 py-2 px-4 rounded-lg border ${
                  mode === 'select'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Existing Collection
              </button>
              <button
                onClick={() => setMode('create')}
                className={`flex-1 py-2 px-4 rounded-lg border ${
                  mode === 'create'
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                New Collection
              </button>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Content based on mode */}
          {mode === 'select' ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Collection
              </label>
              {isLoading ? (
                <div className="text-center py-4 text-gray-500">Loading collections...</div>
              ) : collections.length > 0 ? (
                <select
                  value={selectedCollectionId}
                  onChange={(e) => setSelectedCollectionId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choose a collection...</option>
                  {collections.map((collection) => (
                    <option key={collection.id} value={collection.id}>
                      {collection.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <FolderPlus className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">No collections yet</p>
                  <p className="text-xs text-gray-400">Create your first collection</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Collection Name
              </label>
              <input
                type="text"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="e.g., Sydney Mechanics"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading || (mode === 'select' && !selectedCollectionId) || (mode === 'create' && !newCollectionName.trim())}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <span>Saving...</span>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
