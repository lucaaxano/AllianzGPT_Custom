import { ApiResponse, Workspace, Chat, Message, ImageGenerationResponse } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('auth_token');
  }
  return null;
};

const headers = (): HeadersInit => {
  const token = getToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Auth
export const verifyPassword = async (password: string): Promise<ApiResponse<{ token: string }>> => {
  const res = await fetch(`${API_URL}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  return res.json();
};

export const checkAuth = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${API_URL}/api/auth/check`, {
      headers: headers(),
    });
    const data = await res.json();
    return data.success && data.authenticated;
  } catch {
    return false;
  }
};

// Workspaces
export const getWorkspaces = async (): Promise<ApiResponse<Workspace[]>> => {
  const res = await fetch(`${API_URL}/api/workspaces`, {
    headers: headers(),
  });
  return res.json();
};

export const getWorkspace = async (id: string): Promise<ApiResponse<Workspace & { chats: Chat[] }>> => {
  const res = await fetch(`${API_URL}/api/workspaces/${id}`, {
    headers: headers(),
  });
  return res.json();
};

export const createWorkspace = async (name: string, password: string): Promise<ApiResponse<Workspace>> => {
  const res = await fetch(`${API_URL}/api/workspaces`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ name, password }),
  });
  return res.json();
};

export const verifyWorkspacePassword = async (
  workspaceId: string,
  password: string
): Promise<ApiResponse<Workspace>> => {
  const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/verify`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ password }),
  });
  return res.json();
};

export const deleteWorkspace = async (id: string): Promise<ApiResponse<void>> => {
  const res = await fetch(`${API_URL}/api/workspaces/${id}`, {
    method: 'DELETE',
    headers: headers(),
  });
  return res.json();
};

// Chats
export const getWorkspaceChats = async (workspaceId: string): Promise<ApiResponse<Chat[]>> => {
  const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/chats`, {
    headers: headers(),
  });
  return res.json();
};

export const createChat = async (workspaceId: string, title?: string): Promise<ApiResponse<Chat>> => {
  const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/chats`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ title }),
  });
  return res.json();
};

export const getChat = async (chatId: string): Promise<ApiResponse<Chat>> => {
  const res = await fetch(`${API_URL}/api/chats/${chatId}`, {
    headers: headers(),
  });
  return res.json();
};

export const updateChat = async (chatId: string, title: string): Promise<ApiResponse<Chat>> => {
  const res = await fetch(`${API_URL}/api/chats/${chatId}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify({ title }),
  });
  return res.json();
};

export const deleteChat = async (chatId: string): Promise<ApiResponse<void>> => {
  const res = await fetch(`${API_URL}/api/chats/${chatId}`, {
    method: 'DELETE',
    headers: headers(),
  });
  return res.json();
};

// Messages
export const addMessage = async (
  chatId: string,
  role: 'user' | 'assistant' | 'system',
  content: string
): Promise<ApiResponse<Message>> => {
  const res = await fetch(`${API_URL}/api/chats/${chatId}/messages`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ role, content }),
  });
  return res.json();
};

// OpenAI
export const streamChatCompletion = async (
  messages: Array<{ role: string; content: string }>,
  chatId?: string,
  onChunk: (content: string) => void = () => {},
  onError: (error: string) => void = () => {},
  onDone: () => void = () => {}
) => {
  try {
    const res = await fetch(`${API_URL}/api/chat/completions`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ messages, chatId }),
    });

    if (!res.ok) {
      const error = await res.json();
      onError(error.error || 'An error occurred');
      return;
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      onError('No response body');
      return;
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onDone();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              onChunk(parsed.content);
            }
            if (parsed.error) {
              onError(parsed.error);
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
    onDone();
  } catch (error: any) {
    onError(error.message || 'An error occurred');
  }
};

export const generateImage = async (
  prompt: string,
  chatId?: string
): Promise<ApiResponse<ImageGenerationResponse>> => {
  const res = await fetch(`${API_URL}/api/images/generate`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ prompt, chatId }),
  });
  return res.json();
};

export const analyzeImage = async (
  imageBase64: string,
  prompt: string,
  chatId?: string,
  onChunk: (content: string) => void = () => {},
  onError: (error: string) => void = () => {},
  onDone: () => void = () => {}
) => {
  try {
    const res = await fetch(`${API_URL}/api/images/analyze`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ imageBase64, prompt, chatId }),
    });

    if (!res.ok) {
      const error = await res.json();
      onError(error.error || 'An error occurred');
      return;
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      onError('No response body');
      return;
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onDone();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              onChunk(parsed.content);
            }
            if (parsed.error) {
              onError(parsed.error);
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
    onDone();
  } catch (error: any) {
    onError(error.message || 'An error occurred');
  }
};

export const analyzeDocument = async (
  fileBase64: string,
  fileName: string,
  mimeType: string,
  prompt: string,
  chatId?: string,
  onChunk: (content: string) => void = () => {},
  onError: (error: string) => void = () => {},
  onDone: () => void = () => {}
) => {
  try {
    const res = await fetch(`${API_URL}/api/documents/analyze`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ fileBase64, fileName, mimeType, prompt, chatId }),
    });

    if (!res.ok) {
      const error = await res.json();
      onError(error.error || 'An error occurred');
      return;
    }

    const reader = res.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      onError('No response body');
      return;
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onDone();
            return;
          }
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              onChunk(parsed.content);
            }
            if (parsed.error) {
              onError(parsed.error);
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }
    onDone();
  } catch (error: any) {
    onError(error.message || 'An error occurred');
  }
};
