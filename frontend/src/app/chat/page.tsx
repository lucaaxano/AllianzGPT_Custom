'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Plus,
  Send,
  Loader2,
  Menu,
  X,
  Trash2,
  User,
  Bot,
  Paperclip,
  Image as ImageIcon,
  LogOut,
  ChevronLeft,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  getWorkspaceChats,
  createChat,
  getChat,
  deleteChat,
  addMessage as addMessageApi,
  streamChatCompletion,
  generateImage,
  analyzeImage,
  checkAuth,
} from '@/lib/api';
import { useStore } from '@/stores/store';
import { Chat, Message } from '@/types';

export default function ChatPage() {
  const router = useRouter();
  const {
    isAuthenticated,
    currentWorkspace,
    setCurrentWorkspace,
    chats,
    setChats,
    addChat,
    removeChat,
    currentChatId,
    setCurrentChatId,
    messages,
    setMessages,
    addMessage,
    updateLastMessage,
    isSidebarOpen,
    toggleSidebar,
    isLoading,
    setIsLoading,
    logout,
  } = useStore();

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

      if (!currentWorkspace) {
        router.push('/workspace');
        return;
      }

      await loadChats();
    };
    init();
  }, [isAuthenticated, currentWorkspace, router, logout]);

  const loadChats = async () => {
    if (!currentWorkspace) return;
    setIsLoading(true);
    try {
      const response = await getWorkspaceChats(currentWorkspace.id);
      if (response.success && response.data) {
        setChats(response.data);
      }
    } catch (err) {
      console.error('Failed to load chats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadChat = async (chatId: string) => {
    setIsLoading(true);
    try {
      const response = await getChat(chatId);
      if (response.success && response.data) {
        setMessages(response.data.messages || []);
        setCurrentChatId(chatId);
      }
    } catch (err) {
      console.error('Failed to load chat:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    if (!currentWorkspace) return;
    try {
      const response = await createChat(currentWorkspace.id);
      if (response.success && response.data) {
        addChat(response.data);
        setCurrentChatId(response.data.id);
        setMessages([]);
      }
    } catch (err) {
      console.error('Failed to create chat:', err);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      const response = await deleteChat(chatId);
      if (response.success) {
        removeChat(chatId);
      }
    } catch (err) {
      console.error('Failed to delete chat:', err);
    }
  };

  const handleSelectChat = (chatId: string) => {
    loadChat(chatId);
    if (window.innerWidth < 768) {
      toggleSidebar();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 200) + 'px';
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setAttachedImage(base64);
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setAttachedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedImage) || isStreaming) return;

    let chatId = currentChatId;

    // Create chat if none selected
    if (!chatId && currentWorkspace) {
      try {
        const response = await createChat(currentWorkspace.id);
        if (response.success && response.data) {
          addChat(response.data);
          chatId = response.data.id;
          setCurrentChatId(chatId);
        }
      } catch (err) {
        console.error('Failed to create chat:', err);
        return;
      }
    }

    if (!chatId) return;

    const userContent = input.trim();
    const userImage = attachedImage;

    // Clear input
    setInput('');
    clearImage();
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    // Check for image generation command
    if (userContent.toLowerCase().startsWith('/generate ')) {
      const prompt = userContent.slice(10);

      // Add user message
      const userMsg: Message = {
        id: Date.now().toString(),
        chatId,
        role: 'user',
        content: userContent,
        createdAt: new Date().toISOString(),
      };
      addMessage(userMsg);
      await addMessageApi(chatId, 'user', userContent);

      // Generate image
      setIsStreaming(true);
      try {
        const response = await generateImage(prompt, chatId);
        if (response.success && response.data) {
          const assistantMsg: Message = {
            id: (Date.now() + 1).toString(),
            chatId,
            role: 'assistant',
            content: `![Generated Image](${response.data.url})\n\n*Prompt: ${response.data.revisedPrompt || prompt}*`,
            createdAt: new Date().toISOString(),
          };
          addMessage(assistantMsg);
        }
      } catch (err) {
        console.error('Image generation error:', err);
      } finally {
        setIsStreaming(false);
      }
      return;
    }

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      chatId,
      role: 'user',
      content: userImage ? `[Bild angehängt]\n\n${userContent}` : userContent,
      createdAt: new Date().toISOString(),
    };
    addMessage(userMsg);
    await addMessageApi(chatId, 'user', userImage ? `[Bild angehängt]\n\n${userContent}` : userContent);

    // Add placeholder assistant message
    const assistantMsg: Message = {
      id: (Date.now() + 1).toString(),
      chatId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };
    addMessage(assistantMsg);

    setIsStreaming(true);

    if (userImage) {
      // Image analysis
      let fullContent = '';
      await analyzeImage(
        userImage,
        userContent || 'Was ist auf diesem Bild zu sehen?',
        chatId,
        (chunk) => {
          fullContent += chunk;
          updateLastMessage(fullContent);
        },
        (error) => {
          updateLastMessage(`Fehler: ${error}`);
        },
        () => {
          setIsStreaming(false);
        }
      );
    } else {
      // Regular chat
      const chatMessages = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user' as const, content: userContent },
      ];

      let fullContent = '';
      await streamChatCompletion(
        chatMessages,
        chatId,
        (chunk) => {
          fullContent += chunk;
          updateLastMessage(fullContent);
        },
        (error) => {
          updateLastMessage(`Fehler: ${error}`);
        },
        () => {
          setIsStreaming(false);
        }
      );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleWorkspaceSwitch = () => {
    setCurrentWorkspace(null);
    setCurrentChatId(null);
    setMessages([]);
    setChats([]);
    router.push('/workspace');
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  if (!currentWorkspace) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#212121]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#212121]">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed md:relative md:translate-x-0 z-40 w-64 h-full bg-[#171717] border-r border-[#2d2d2d] flex flex-col transition-transform`}
      >
        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-4 py-3 bg-[#2d2d2d] hover:bg-[#3d3d3d] text-white rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Neuer Chat</span>
          </button>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-2">
          {chats.length === 0 ? (
            <div className="text-center py-8 text-gray-500 text-sm">
              Noch keine Chats
            </div>
          ) : (
            chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleSelectChat(chat.id)}
                className={`group flex items-center gap-2 px-3 py-2 my-1 rounded-lg cursor-pointer transition-colors ${
                  currentChatId === chat.id
                    ? 'bg-[#2d2d2d]'
                    : 'hover:bg-[#2d2d2d]'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="flex-1 text-sm text-gray-300 truncate">
                  {chat.title}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteChat(chat.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Workspace Info */}
        <div className="p-3 border-t border-[#2d2d2d]">
          <div
            onClick={handleWorkspaceSwitch}
            className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-[#2d2d2d] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {currentWorkspace.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{currentWorkspace.name}</p>
              <p className="text-xs text-gray-500">Workspace wechseln</p>
            </div>
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-2 flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-white hover:bg-[#2d2d2d] rounded-lg transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Abmelden</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center gap-4 px-4 py-3 border-b border-[#2d2d2d] md:hidden">
          <button onClick={toggleSidebar} className="text-gray-400 hover:text-white">
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h1 className="text-lg font-medium text-white">AllianzGPT</h1>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="w-16 h-16 rounded-full bg-primary-600 flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-white mb-2">
                Wie kann ich helfen?
              </h2>
              <p className="text-gray-400 text-center max-w-md">
                Stellen Sie eine Frage, laden Sie ein Bild hoch oder verwenden Sie
                <code className="mx-1 px-1 bg-[#2d2d2d] rounded">/generate</code>
                um Bilder zu erstellen.
              </p>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 mb-6 ${
                    message.role === 'user' ? 'justify-end' : ''
                  }`}
                >
                  {message.role !== 'user' && (
                    <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-primary-600 text-white'
                        : 'bg-[#2d2d2d] text-gray-100'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    ) : message.content ? (
                      <div className="markdown-body">
                        <ReactMarkdown
                          remarkPlugins={[remarkGfm]}
                          components={{
                            code({ node, className, children, ...props }) {
                              const match = /language-(\w+)/.exec(className || '');
                              const inline = !match;
                              return !inline && match ? (
                                <SyntaxHighlighter
                                  style={oneDark}
                                  language={match[1]}
                                  PreTag="div"
                                >
                                  {String(children).replace(/\n$/, '')}
                                </SyntaxHighlighter>
                              ) : (
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              );
                            },
                            img({ src, alt }) {
                              return (
                                <img
                                  src={src}
                                  alt={alt || 'Generated image'}
                                  className="max-w-full rounded-lg my-2"
                                />
                              );
                            },
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <span className="animate-pulse">●●●</span>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-[#4d4d4d] flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-white" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-[#2d2d2d] px-4 py-4">
          <div className="max-w-3xl mx-auto">
            {imagePreview && (
              <div className="mb-2 relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-20 rounded-lg"
                />
                <button
                  onClick={clearImage}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    adjustTextareaHeight();
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="Nachricht eingeben..."
                  className="w-full px-4 py-3 pr-24 bg-[#2d2d2d] border border-[#4d4d4d] rounded-2xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none max-h-[200px]"
                  rows={1}
                  disabled={isStreaming}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-white transition-colors"
                    disabled={isStreaming}
                  >
                    <ImageIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isStreaming || (!input.trim() && !attachedImage)}
                className="p-3 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
              >
                {isStreaming ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
            <p className="text-xs text-gray-500 mt-2 text-center">
              Nutze <code className="px-1 bg-[#2d2d2d] rounded">/generate [prompt]</code> für Bildgenerierung
            </p>
          </div>
        </div>
      </main>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={toggleSidebar}
        />
      )}
    </div>
  );
}
