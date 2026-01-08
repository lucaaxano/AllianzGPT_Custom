'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, AlertCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { verifyPassword, checkAuth } from '@/lib/api';
import { useStore } from '@/stores/store';

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, setAuth } = useStore();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const check = async () => {
      if (isAuthenticated) {
        const valid = await checkAuth();
        if (valid) {
          router.push('/workspace');
          return;
        }
      }
      setIsChecking(false);
    };
    check();
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await verifyPassword(password);
      if (response.success && response.data?.token) {
        setAuth(response.data.token);
        router.push('/workspace');
      } else {
        setError(response.error || 'Falsches Passwort');
      }
    } catch (err) {
      setError('Ein Fehler ist aufgetreten');
    } finally {
      setIsLoading(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <Loader2 className="w-8 h-8 animate-spin text-[#FF8049]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#FF8049] mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-[#2F3542] mb-2">Sena GPT</h1>
          <p className="text-[#2F3542]/60">Internal AI Chat Workspace</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#2F3542] mb-2">
              Zugangspasswort
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passwort eingeben"
                className="w-full px-4 py-3 pr-12 bg-white border border-[#D1D4D8] rounded-lg text-[#2F3542] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1A2B4C] focus:border-transparent"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#2F3542] transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !password}
            className="w-full py-3 px-4 bg-[#1A2B4C] hover:bg-[#152340] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Wird geprüft...</span>
              </>
            ) : (
              <span>Zugang erhalten</span>
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#2F3542]/50">
          Kontaktieren Sie den Administrator für Zugangsdaten
        </p>
      </div>
    </div>
  );
}
