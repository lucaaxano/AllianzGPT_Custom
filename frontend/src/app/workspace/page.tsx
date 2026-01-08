'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Plus, Loader2, Search, Trash2, X, Lock, Eye, EyeOff } from 'lucide-react';
import { getWorkspaces, createWorkspace, deleteWorkspace, checkAuth, verifyWorkspacePassword } from '@/lib/api';
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
  const [newWorkspacePassword, setNewWorkspacePassword] = useState('');
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Password verification modal state
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [showEnteredPassword, setShowEnteredPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState('');

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
    setSelectedWorkspace(workspace);
    setShowPasswordModal(true);
    setEnteredPassword('');
    setVerifyError('');
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkspace || !enteredPassword) return;

    setIsVerifying(true);
    setVerifyError('');

    try {
      const response = await verifyWorkspacePassword(selectedWorkspace.id, enteredPassword);
      if (response.success && response.data) {
        setCurrentWorkspace(response.data);
        setShowPasswordModal(false);
        router.push('/chat');
      } else {
        setVerifyError(response.error || 'Falsches Passwort');
      }
    } catch (err) {
      setVerifyError('Fehler bei der Überprüfung');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWorkspaceName.trim() || !newWorkspacePassword) return;

    if (newWorkspacePassword.length < 4) {
      setCreateError('Passwort muss mindestens 4 Zeichen haben');
      return;
    }

    setIsCreating(true);
    setCreateError('');

    try {
      const response = await createWorkspace(newWorkspaceName.trim(), newWorkspacePassword);
      if (response.success && response.data) {
        setWorkspaces([response.data, ...workspaces]);
        setShowCreateModal(false);
        setNewWorkspaceName('');
        setNewWorkspacePassword('');
      } else {
        setCreateError(response.error || 'Fehler beim Erstellen');
      }
    } catch (err) {
      setCreateError('Fehler beim Erstellen');
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
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF8049]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#2F3542] mb-2">Workspace auswählen</h1>
          <p className="text-[#2F3542]/60">Wählen Sie Ihren persönlichen Workspace</p>
        </div>

        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Workspace suchen..."
              className="w-full pl-10 pr-4 py-3 bg-white border border-[#D1D4D8] rounded-lg text-[#2F3542] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1A2B4C]"
            />
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-3 bg-[#1A2B4C] hover:bg-[#152340] text-white font-medium rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Neu</span>
          </button>
        </div>

        {filteredWorkspaces.length === 0 ? (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-[#2F3542]/60">
              {searchQuery ? 'Keine Workspaces gefunden' : 'Noch keine Workspaces vorhanden'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 text-[#FF8049] hover:text-[#E86D3A]"
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
                className="group relative p-6 bg-white border border-[#E1E4E8] rounded-lg cursor-pointer hover:border-[#1A2B4C] hover:shadow-md transition-all"
              >
                <button
                  onClick={(e) => handleDeleteWorkspace(e, workspace.id)}
                  className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-[#FF8049] flex items-center justify-center">
                    <span className="text-white font-semibold text-lg">
                      {workspace.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[#2F3542] truncate">{workspace.name}</h3>
                    <p className="text-sm text-[#2F3542]/60">
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
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#2F3542]">Neuer Workspace</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateError('');
                  }}
                  className="text-gray-400 hover:text-[#2F3542]"
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
                  className="w-full px-4 py-3 bg-[#F5F7FA] border border-[#D1D4D8] rounded-lg text-[#2F3542] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1A2B4C] mb-4"
                  autoFocus
                />
                <div className="relative mb-4">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showCreatePassword ? 'text' : 'password'}
                    value={newWorkspacePassword}
                    onChange={(e) => setNewWorkspacePassword(e.target.value)}
                    placeholder="Passwort (min. 4 Zeichen)"
                    className="w-full pl-10 pr-10 py-3 bg-[#F5F7FA] border border-[#D1D4D8] rounded-lg text-[#2F3542] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1A2B4C]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2F3542]"
                  >
                    {showCreatePassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {createError && (
                  <p className="text-red-500 text-sm mb-4">{createError}</p>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setCreateError('');
                    }}
                    className="flex-1 py-2 px-4 bg-[#E1E4E8] hover:bg-[#D1D4D8] text-[#2F3542] rounded-lg transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || !newWorkspaceName.trim() || !newWorkspacePassword}
                    className="flex-1 py-2 px-4 bg-[#1A2B4C] hover:bg-[#152340] disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
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

        {/* Password Verification Modal */}
        {showPasswordModal && selectedWorkspace && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#2F3542]">
                  Workspace entsperren
                </h2>
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setVerifyError('');
                  }}
                  className="text-gray-400 hover:text-[#2F3542]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-4 mb-6 p-4 bg-[#F5F7FA] rounded-lg">
                <div className="w-12 h-12 rounded-full bg-[#FF8049] flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {selectedWorkspace.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h3 className="font-medium text-[#2F3542]">{selectedWorkspace.name}</h3>
                  <p className="text-sm text-[#2F3542]/60">
                    {selectedWorkspace._count?.chats || 0} Chats
                  </p>
                </div>
              </div>
              <form onSubmit={handleVerifyPassword}>
                <div className="relative mb-4">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showEnteredPassword ? 'text' : 'password'}
                    value={enteredPassword}
                    onChange={(e) => setEnteredPassword(e.target.value)}
                    placeholder="Passwort eingeben"
                    className="w-full pl-10 pr-10 py-3 bg-[#F5F7FA] border border-[#D1D4D8] rounded-lg text-[#2F3542] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1A2B4C]"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowEnteredPassword(!showEnteredPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2F3542]"
                  >
                    {showEnteredPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {verifyError && (
                  <p className="text-red-500 text-sm mb-4">{verifyError}</p>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setVerifyError('');
                    }}
                    className="flex-1 py-2 px-4 bg-[#E1E4E8] hover:bg-[#D1D4D8] text-[#2F3542] rounded-lg transition-colors"
                  >
                    Abbrechen
                  </button>
                  <button
                    type="submit"
                    disabled={isVerifying || !enteredPassword}
                    className="flex-1 py-2 px-4 bg-[#1A2B4C] hover:bg-[#152340] disabled:bg-gray-300 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    {isVerifying ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      'Entsperren'
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
