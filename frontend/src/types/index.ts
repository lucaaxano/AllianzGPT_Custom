export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    chats: number;
  };
}

export interface Chat {
  id: string;
  title: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
  workspace?: {
    id: string;
    name: string;
  };
}

export interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ImageGenerationResponse {
  url: string;
  revisedPrompt?: string;
}
