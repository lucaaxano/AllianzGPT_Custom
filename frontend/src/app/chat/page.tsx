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
  LogOut,
  ChevronLeft,
  Pencil,
  FileText,
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
  updateChat,
  addMessage as addMessageApi,
  streamChatCompletion,
  generateImage,
  analyzeImage,
  analyzeDocument,
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
    updateChatTitle,
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
  const [attachedFile, setAttachedFile] = useState<{base64: string; name: string; type: string} | null>(null);
  const [renamingChatId, setRenamingChatId] = useState<string | null>(null);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [deletingChatId, setDeletingChatId] = useState<string | null>(null);
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

  const handleRenameChat = async () => {
    if (!renamingChatId || !newChatTitle.trim()) return;
    try {
      const response = await updateChat(renamingChatId, newChatTitle.trim());
      if (response.success) {
        updateChatTitle(renamingChatId, newChatTitle.trim());
      }
    } catch (err) {
      console.error('Failed to rename chat:', err);
    } finally {
      setRenamingChatId(null);
      setNewChatTitle('');
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      if (isImage) {
        setAttachedImage(base64);
        setImagePreview(reader.result as string);
        setAttachedFile(null);
      } else {
        setAttachedFile({
          base64,
          name: file.name,
          type: file.type,
        });
        setAttachedImage(null);
        setImagePreview(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const clearFile = () => {
    setAttachedImage(null);
    setImagePreview(null);
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !attachedImage && !attachedFile) || isStreaming) return;

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
    const userFile = attachedFile;

    // Clear input
    setInput('');
    clearFile();
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

    // Build user message content
    let userMessageContent = userContent;
    if (userImage) {
      userMessageContent = `[Bild angehängt]\n\n${userContent}`;
    } else if (userFile) {
      userMessageContent = `[Dokument: ${userFile.name}]\n\n${userContent}`;
    }

    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      chatId,
      role: 'user',
      content: userMessageContent,
      createdAt: new Date().toISOString(),
    };
    addMessage(userMsg);
    await addMessageApi(chatId, 'user', userMessageContent);

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

    if (userFile) {
      // Document analysis
      let fullContent = '';
      await analyzeDocument(
        userFile.base64,
        userFile.name,
        userFile.type,
        userContent || 'Was steht in diesem Dokument? Fasse den Inhalt zusammen.',
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
    } else if (userImage) {
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
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#F5F7FA]">
      {/* Sidebar */}
      <aside
        className={`${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } fixed md:relative md:translate-x-0 z-40 w-64 h-full bg-[#EEF1F5] border-r border-[#E1E4E8] flex flex-col transition-transform`}
      >
        {/* New Chat Button */}
        <div className="p-3">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-4 py-3 bg-[#1A2B4C] hover:bg-[#152340] text-white rounded-lg transition-colors"
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
                    ? 'bg-white'
                    : 'hover:bg-white'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <span className="flex-1 text-sm text-[#2F3542] truncate">
                  {chat.title}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setRenamingChatId(chat.id);
                    setNewChatTitle(chat.title);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-[#1A2B4C] transition-opacity"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingChatId(chat.id);
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
        <div className="p-3 border-t border-[#E1E4E8]">
          <div
            onClick={handleWorkspaceSwitch}
            className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-white transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center">
              <span className="text-white font-medium text-sm">
                {currentWorkspace.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#2F3542] truncate">{currentWorkspace.name}</p>
              <p className="text-xs text-gray-500">Workspace wechseln</p>
            </div>
            <ChevronLeft className="w-4 h-4 text-gray-500" />
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-2 flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-[#2F3542] hover:bg-white rounded-lg transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            <span>Abmelden</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center gap-4 px-4 py-3 border-b border-[#E1E4E8] md:hidden">
          <button onClick={toggleSidebar} className="text-gray-500 hover:text-[#2F3542]">
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <h1 className="text-lg font-medium text-[#2F3542]">AllianzGPT</h1>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4">
              <div className="w-16 h-16 rounded-full bg-[#FF8049] flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-[#2F3542] mb-2">
                Wie kann ich helfen?
              </h2>
              <p className="text-[#2F3542]/60 text-center max-w-md">
                Stellen Sie eine Frage, laden Sie ein Bild hoch oder verwenden Sie
                <code className="mx-1 px-1 bg-[#E1E4E8] rounded">/generate</code>
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
                    <div className="w-8 h-8 rounded-full bg-[#FF8049] flex items-center justify-center flex-shrink-0">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
                        ? 'bg-[#1A2B4C] text-white'
                        : 'bg-white text-[#2F3542] border border-[#E1E4E8]'
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
                      <div className="flex items-center gap-2 text-[#2F3542]/60">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-[#FF8049] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-[#FF8049] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-[#FF8049] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                        <span className="text-sm">Generiert...</span>
                      </div>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-[#1A2B4C] flex items-center justify-center flex-shrink-0">
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
        <div className="border-t border-[#E1E4E8] px-4 py-4">
          <div className="max-w-3xl mx-auto">
            {imagePreview && (
              <div className="mb-2 relative inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="h-20 rounded-lg"
                />
                <button
                  onClick={clearFile}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            {attachedFile && (
              <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-white border border-[#E1E4E8] rounded-lg inline-flex">
                <FileText className="w-5 h-5 text-[#FF8049]" />
                <span className="text-sm text-[#2F3542]">{attachedFile.name}</span>
                <button
                  onClick={clearFile}
                  className="ml-2 text-gray-500 hover:text-red-400 transition-colors"
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
                  className="w-full px-4 py-3 pr-24 bg-white border border-[#D1D4D8] rounded-2xl text-[#2F3542] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1A2B4C] resize-none max-h-[200px]"
                  rows={1}
                  disabled={isStreaming}
                />
                <div className="absolute right-2 bottom-2 flex items-center gap-1">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-gray-400 hover:text-[#2F3542] transition-colors"
                    disabled={isStreaming}
                    title="Bild oder Dokument anhängen"
                  >
                    <Paperclip className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={isStreaming || (!input.trim() && !attachedImage && !attachedFile)}
                className="p-3 bg-[#1A2B4C] hover:bg-[#152340] disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
              >
                {isStreaming ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </form>
            <p className="text-xs text-[#2F3542]/50 mt-2 text-center">
              Nutze <code className="px-1 bg-[#E1E4E8] rounded">/generate [prompt]</code> für Bildgenerierung | PDF, DOCX, XLSX, TXT, CSV hochladen
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

      {/* Rename Chat Modal */}
      {renamingChatId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-lg">
            <h2 className="text-lg font-semibold text-[#2F3542] mb-4">Chat umbenennen</h2>
            <input
              type="text"
              value={newChatTitle}
              onChange={(e) => setNewChatTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRenameChat();
                if (e.key === 'Escape') setRenamingChatId(null);
              }}
              className="w-full px-4 py-2 bg-[#F5F7FA] border border-[#D1D4D8] rounded-lg text-[#2F3542] mb-4 focus:outline-none focus:ring-2 focus:ring-[#1A2B4C]"
              autoFocus
            />
            <div className="flex gap-3">
              <button
                onClick={() => setRenamingChatId(null)}
                className="flex-1 py-2 bg-[#E1E4E8] hover:bg-[#D1D4D8] text-[#2F3542] rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={handleRenameChat}
                className="flex-1 py-2 bg-[#1A2B4C] hover:bg-[#152340] text-white rounded-lg transition-colors"
              >
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Chat Confirmation Modal */}
      {deletingChatId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 shadow-lg">
            <h2 className="text-lg font-semibold text-[#2F3542] mb-2">Chat löschen?</h2>
            <p className="text-[#2F3542]/70 mb-4">Dieser Chat wird unwiderruflich gelöscht.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingChatId(null)}
                className="flex-1 py-2 bg-[#E1E4E8] hover:bg-[#D1D4D8] text-[#2F3542] rounded-lg transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  handleDeleteChat(deletingChatId);
                  setDeletingChatId(null);
                }}
                className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
