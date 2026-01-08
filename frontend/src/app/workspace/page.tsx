'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Plus, Loader2, Search, Trash2, X } from 'lucide-react';
import { getWorkspaces, createWorkspace, deleteWorkspace, checkAuth } from '@/lib/api';
import { useStore } from '@/stores/store';
import { Workspace } from '@/types';

export default function WorkspacePage() {
  const router = useRouter();
  const { isAuthenticated, setCurrentWorkspace, logout } = useStore();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!isAuthenticated) {
        router.push('/');
        return;
      }

      const valid = await checkAuth();
      if (!valid) {
        logout();
        router.push('/');
        return;
      }

      await loadWorkspaces();
    };
    init();
  }, [isAuthenticated, router, logout]);

  const loadWorkspaces = async () => {
    setIsLoading(true);
    try {
      const response = await getWorkspaces();
      if (response.success && response.data) {
        setWorkspaces(response.data);
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectWorkspace = (workspace: Workspace) => {
    setCurrentWorkspace(workspace);
    router.push('/chat');
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    setIsCreating(true);
    try {
      const response = await createWorkspace(newWorkspaceName.trim());
      if (response.success && response.data) {
        setWorkspaces([response.data, ...workspaces]);
        setShowCreateModal(false);
        setNewWorkspaceName('');
      }
    } catch (err) {
      console.error('Failed to create workspace:', err);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteWorkspace = async (e: React.MouseEvent, workspaceId: string) => {
    e.stopPropagation();
    if (!confirm('Workspace wirklich löschen? Alle Chats werden gelöscht.')) return;

    try {
      const response = await deleteWorkspace(workspaceId);
      if (response.success) {
        setWorkspaces(workspaces.filter((w) => w.id !== workspaceId));
      }
    } catch (err) {
      console.error('Failed to delete workspace:', err);
    }
  };

  const filteredWorkspaces = workspaces.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#212121]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#212121] px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Workspace auswählen</h1>
          <p className="text-gray-400">Wählen Sie Ihren persönlichen Workspace</p>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Workspace suchen..."
              className="w-full pl-10 pr-4 py-3 bg-[#2d2d2d] border border-[#4d4d4d] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Neu</span>
          </button>
        </div>

        {filteredWorkspaces.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">
              {searchQuery ? 'Keine Workspaces gefunden' : 'Noch keine Workspaces vorhanden'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-primary-400 hover:text-primary-300"
              >
                Ersten Workspace erstellen
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredWorkspaces.map((workspace) => (
              <div
                key={workspace.id}
                onClick={() => handleSelectWorkspace(workspace)}
                className="group relative p-6 bg-[#2d2d2d] border border-[#4d4d4d] rounded-lg cursor-pointer hover:bg-[#3d3d3d] hover:border-primary-500 transition-all"
              >
                <button
                  onClick={(e) => handleDeleteWorkspace(e, workspace.id)}
                  className="absolute top-3 right-3 p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {workspace.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-white truncate">{workspace.name}</h3>
                    <p className="text-sm text-gray-400">
                      {workspace._count?.chats || 0} Chats
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-[#2d2d2d] rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">Neuer Workspace</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleCreateWorkspace}>
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="Name des Mitarbeiters"
                  className="w-full px-4 py-3 bg-[#1e1e1e] border border-[#4d4d4d] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 mb-4"
                  autoFocus
                />
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 py-2 px-4 bg-[#4d4d4d] hover:bg-[#5d5d5d] text-white rounded-lg transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || !newWorkspaceName.trim()}
                    className="flex-1 py-2 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isCreating ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Erstellen'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
