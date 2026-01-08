import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Workspace, Chat, Message } from '@/types';

interface AppState {
  // Auth
  isAuthenticated: boolean;
  token: string | null;
  setAuth: (token: string) => void;
  logout: () => void;

  // Workspace
  currentWorkspace: Workspace | null;
  setCurrentWorkspace: (workspace: Workspace | null) => void;

  // Chats
  chats: Chat[];
  setChats: (chats: Chat[]) => void;
  addChat: (chat: Chat) => void;
  removeChat: (chatId: string) => void;
  updateChatTitle: (chatId: string, title: string) => void;

  // Current Chat
  currentChatId: string | null;
  setCurrentChatId: (chatId: string | null) => void;
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  updateLastMessage: (content: string) => void;

  // UI
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Auth
      isAuthenticated: false,
      token: null,
      setAuth: (token) => {
        localStorage.setItem('auth_token', token);
        set({ isAuthenticated: true, token });
      },
      logout: () => {
        localStorage.removeItem('auth_token');
        set({
          isAuthenticated: false,
          token: null,
          currentWorkspace: null,
          chats: [],
          currentChatId: null,
          messages: [],
        });
      },

      // Workspace
      currentWorkspace: null,
      setCurrentWorkspace: (workspace) => set({ currentWorkspace: workspace }),

      // Chats
      chats: [],
      setChats: (chats) => set({ chats }),
      addChat: (chat) => set((state) => ({ chats: [chat, ...state.chats] })),
      removeChat: (chatId) =>
        set((state) => ({
          chats: state.chats.filter((c) => c.id !== chatId),
          currentChatId: state.currentChatId === chatId ? null : state.currentChatId,
          messages: state.currentChatId === chatId ? [] : state.messages,
        })),
      updateChatTitle: (chatId, title) =>
        set((state) => ({
          chats: state.chats.map((c) => (c.id === chatId ? { ...c, title } : c)),
        })),

      // Current Chat
      currentChatId: null,
      setCurrentChatId: (chatId) => set({ currentChatId: chatId }),
      messages: [],
      setMessages: (messages) => set({ messages }),
      addMessage: (message) =>
        set((state) => ({ messages: [...state.messages, message] })),
      updateLastMessage: (content) =>
        set((state) => {
          const messages = [...state.messages];
          if (messages.length > 0) {
            messages[messages.length - 1] = {
              ...messages[messages.length - 1],
              content,
            };
          }
          return { messages };
        }),

      // UI
      isSidebarOpen: true,
      toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'allianzgpt-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        currentWorkspace: state.currentWorkspace,
      }),
    }
  )
);
