'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { socketService } from '@/lib/socket';
import { useAuthStore } from '@/store/useAuthStore';
import { uploadFiles } from '@/lib/uploadthing';
import { Message } from '@/types';
import { Search, Send, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [attachmentKind, setAttachmentKind] = useState<
    "image" | "pdf" | "other" | null
  >(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageModalUrl, setImageModalUrl] = useState<string | null>(null);
  const [imageModalName, setImageModalName] = useState<string | null>(null);
  const [imageModalZoom, setImageModalZoom] = useState<number>(1);

  const MIN_IMAGE_ZOOM = 0.5;
  const MAX_IMAGE_ZOOM = 3;
  const IMAGE_ZOOM_STEP = 0.25;

  type Contact = {
    id: string;
    fullName?: string;
    role: string;
    specialization?: string | null;
  };

  useEffect(() => {
    return () => {
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
    };
  }, [localPreviewUrl]);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch conversations/contacts based on user role
  const { data: contacts = [], isLoading: loadingContacts } = useQuery<Contact[]>({
    queryKey: ['contacts', debouncedSearch],
    queryFn: async () => {
      const res = await api.get(`/messages/contacts?search=${debouncedSearch}`);
      return res.data;
    }
  });

  // Fetch messages with selected user
  const { isLoading: loadingMessages } = useQuery({
    queryKey: ['messages', selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return [];
      const res = await api.get(`/messages?with=${selectedUserId}`);
      setMessages(res.data);
      return res.data;
    },
    enabled: !!selectedUserId,
  });

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket) {
      socketService.connect();
    }
    
    const activeSocket = socketService.getSocket();
    if (!activeSocket) return;

    const handleNewMessage = (newMessage: Message) => {
      if (
        (newMessage.senderId === selectedUserId && newMessage.receiverId === user?.id) ||
        (newMessage.senderId === user?.id && newMessage.receiverId === selectedUserId)
      ) {
        setMessages((prev) => [...prev, newMessage]);
        setTimeout(scrollToBottom, 100);
      }
    };

    activeSocket.on('message:received', handleNewMessage);

    return () => {
      activeSocket.off('message:received', handleNewMessage);
    };
  }, [selectedUserId, user?.id]);

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getFileNameFromUrl = (url?: string | null) => {
    if (!url) return null;
    try {
      const u = new URL(url);
      const candidate =
        u.searchParams.get('filename') ||
        u.searchParams.get('fileName') ||
        u.searchParams.get('name');
      if (candidate) return candidate;
      const last = u.pathname.split('/').pop();
      return last ? decodeURIComponent(last) : null;
    } catch {
      return null;
    }
  };

  const getAttachmentKindFromFileName = (name?: string | null) => {
    if (!name) return null;
    const lower = name.toLowerCase();
    if (/\.(png|jpe?g|gif|webp|bmp|svg)$/.test(lower)) return "image";
    if (lower.endsWith(".pdf")) return "pdf";
    return "other";
  };

  const getAttachmentKindFromUrl = (url?: string | null) => {
    const name = getFileNameFromUrl(url);
    return getAttachmentKindFromFileName(name);
  };

  const MessageAttachmentPreview = ({ url }: { url: string }) => {
    const kind = getAttachmentKindFromUrl(url);
    const fileName = getFileNameFromUrl(url) ?? 'Attachment';
    const [imageOk, setImageOk] = useState(true);

    // PDF stays a real embed.
    if (kind === 'pdf') {
      return (
        <iframe
          src={url}
          title={fileName}
          className="mt-2 w-72 max-w-full h-48 rounded bg-white border border-gray-200"
        />
      );
    }

    // If we already know it's an image, render as clickable.
    if (kind === 'image') {
      return (
        <img
          src={url}
          alt={fileName}
          className="rounded max-w-full h-12 object-contain cursor-zoom-in hover:opacity-90 transition-opacity"
          draggable={false}
          onClick={() => openImageModal(url, fileName)}
        />
      );
    }

    // Otherwise, try loading it as an image anyway (Telegram-like behavior).
    if (!imageOk) {
      return (
        <a
          href={url}
          download={fileName}
          className="mt-2 inline-flex text-xs underline text-inherit"
          target="_blank"
          rel="noreferrer"
        >
          {fileName}
        </a>
      );
    }

    return (
      <img
        src={url}
        alt={fileName}
        className="rounded max-w-full h-12 object-contain cursor-zoom-in hover:opacity-90 transition-opacity"
        draggable={false}
        onError={() => setImageOk(false)}
        onClick={() => openImageModal(url, fileName)}
      />
    );
  };

  const openImageModal = (url: string, name?: string | null) => {
    setImageModalUrl(url);
    setImageModalName(name ?? getFileNameFromUrl(url));
    setImageModalZoom(1);
    setImageModalOpen(true);
  };

  const closeImageModal = () => {
    setImageModalOpen(false);
    // Clear URL after close to free memory and avoid unnecessary renders.
    setImageModalUrl(null);
    setImageModalName(null);
    setImageModalZoom(1);
  };

  useEffect(() => {
    if (!imageModalOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeImageModal();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [imageModalOpen]);

  const onAttachmentFileChange = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Revoke any previous object URL to avoid memory leaks.
    if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);

    setLocalPreviewUrl(URL.createObjectURL(file));
    setAttachmentKind(getAttachmentKindFromFileName(file.name));
    setAttachmentUrl(null);
    setAttachmentName(file.name);

    setUploadingAttachment(true);
    try {
      const uploaded = await uploadFiles('licenseUploader', {
        files: [file],
      });

      const first = uploaded?.[0];
      const baseUrl = first?.url ?? first?.appUrl ?? first?.ufsUrl;

      if (baseUrl) {
        // Ensure the chat renderer can infer file type (image vs pdf vs other)
        // by preserving the original filename in the URL.
        const u = new URL(baseUrl);
        if (!u.searchParams.has('filename')) {
          u.searchParams.set('filename', file.name);
        }

        setAttachmentUrl(u.toString());
      }
    } catch (err) {
      console.error('Failed to upload attachment', err);
      // Keep local preview, but don't show a sent/ready fileUrl.
      setAttachmentUrl(null);
    } finally {
      setUploadingAttachment(false);
      // Allow re-uploading the same file.
      if (e.target) e.target.value = '';
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    const hasText = !!messageText.trim();
    const hasAttachment = !!attachmentUrl;
    if (!hasText && !hasAttachment) return;

    const payload: {
      receiverId: string;
      messageText?: string;
      fileUrl?: string;
    } = { receiverId: selectedUserId };

    if (hasText) payload.messageText = messageText;
    if (hasAttachment) {
      payload.fileUrl = attachmentUrl;
    }

    // Optimistic UI update could be added here
    try {
      const res = await api.post('/messages', payload);
      // Backend should broadcast 'message:received' to us as well, or we append directly
      setMessages((prev) => [...prev, res.data]);
      setMessageText('');
      setAttachmentUrl(null);
      setAttachmentName(null);
      setAttachmentKind(null);
      if (localPreviewUrl) URL.revokeObjectURL(localPreviewUrl);
      setLocalPreviewUrl(null);
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  console.log('messages: ', messages);

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
      {/* Sidebar - Contacts */}
      <div className="w-1/3 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
          <div className="relative mt-3">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full py-2 pl-10 pr-3 border border-gray-300 rounded-md shadow-sm bg-gray-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
              {loadingContacts ? (
            <div className="p-4 text-center text-sm text-gray-500">Loading contacts...</div>
          ) : (
             <ul className="divide-y divide-gray-100">
              {contacts.map((contact) => {
                const contactUserId = contact.id;
                const contactName = contact.fullName || 'Unknown';
                const isSelected = selectedUserId === contactUserId;
                const subtext = contact.role === 'provider' ? contact.specialization : 'Patient';

                return (
                  <li 
                    key={contact.id} 
                    onClick={() => setSelectedUserId(contactUserId)}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-10 h-10 text-sm font-medium text-blue-800 bg-blue-100 rounded-full">
                        {contactName.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{contactName}</p>
                        <p className="text-xs text-gray-500 truncate">{subtext}</p>
                      </div>
                    </div>
                  </li>
                );
              })}
             </ul>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="w-2/3 flex flex-col bg-gray-50">
        {selectedUserId ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-white shadow-sm z-10 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 text-sm font-medium text-blue-800 bg-blue-100 rounded-full">
                  U
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-900">Current Conversation</h3>
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {loadingMessages ? (
                <div className="text-center text-sm text-gray-500">Loading messages...</div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-center text-gray-500">
                  <p>No messages yet. Say hi!</p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.senderId === user?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-lg p-1 ${isMine ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none shadow-sm'}`}>
                        {msg.messageText && <p className="text-sm">{msg.messageText}</p>}
                        {msg.fileUrl ? (
                          <MessageAttachmentPreview url={msg.fileUrl} />
                        ) : null}
                        <span className={`text-[10px] mt-1 block ${isMine ? 'text-blue-200' : 'text-gray-400'}`}>
                          {format(new Date(msg.timestamp), 'h:mm a')}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white border-t border-gray-200">
              <form onSubmit={sendMessage} className="flex items-end space-x-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-gray-400 rounded-full hover:text-gray-600 hover:bg-gray-100 focus:outline-none disabled:opacity-50"
                  disabled={uploadingAttachment}
                >
                  <ImageIcon className="w-5 h-5" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={onAttachmentFileChange}
                />
                <div className="flex-1">
                  {localPreviewUrl && (
                    <div className="mb-2 flex items-start gap-2">
                      <div className="relative w-40 h-28 rounded-md overflow-hidden border border-gray-200 bg-gray-50">
                        {attachmentKind === 'image' ? (
                          <img
                            src={localPreviewUrl}
                            alt={attachmentName ?? 'attachment'}
                            className="w-full h-full object-cover cursor-zoom-in hover:opacity-90 transition-opacity"
                            onClick={() =>
                              localPreviewUrl &&
                              openImageModal(localPreviewUrl, attachmentName)
                            }
                          />
                        ) : attachmentKind === 'pdf' ? (
                          <iframe
                            src={localPreviewUrl}
                            title={attachmentName ?? 'pdf'}
                            className="w-full h-full"
                          />
                        ) : (
                          <div className="p-2 h-full flex flex-col justify-center">
                            <div className="text-xs font-medium text-gray-800 truncate">
                              {attachmentName ?? 'Attachment'}
                            </div>
                            <div className="text-[10px] text-gray-500">File</div>
                          </div>
                        )}

                        {uploadingAttachment && (
                          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                            <div className="h-10 w-10 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (localPreviewUrl)
                            URL.revokeObjectURL(localPreviewUrl);
                          setLocalPreviewUrl(null);
                          setAttachmentUrl(null);
                          setAttachmentName(null);
                          setAttachmentKind(null);
                        }}
                        className="mt-1 text-xs text-gray-500 hover:text-gray-700 underline"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-none"
                    rows={1}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage(e);
                      }
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={
                    uploadingAttachment ||
                    (!messageText.trim() && !attachmentUrl)
                  }
                  className="inline-flex items-center justify-center p-2 text-white bg-blue-600 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <MessageSquare className="w-12 h-12 mb-4 text-gray-300" />
            <p className="text-lg font-medium text-gray-900">Your Messages</p>
            <p className="mt-1">Select a contact from the sidebar to start chatting.</p>
          </div>
        )}

        {imageModalOpen && imageModalUrl && (
          <div
            className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
            onClick={closeImageModal}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="bg-black/95 rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-white/10"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 px-3 py-2 border-b border-white/10">
                <div className="text-xs text-white/80 truncate">
                  {imageModalName ?? 'Image'}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setImageModalZoom((z) =>
                        Math.min(MAX_IMAGE_ZOOM, z + IMAGE_ZOOM_STEP)
                      )
                    }
                    disabled={imageModalZoom >= MAX_IMAGE_ZOOM}
                    className="px-2 py-1 text-xs rounded-md bg-white/10 text-white disabled:opacity-50 hover:bg-white/15"
                  >
                    Zoom +
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setImageModalZoom((z) =>
                        Math.max(MIN_IMAGE_ZOOM, z - IMAGE_ZOOM_STEP)
                      )
                    }
                    disabled={imageModalZoom <= MIN_IMAGE_ZOOM}
                    className="px-2 py-1 text-xs rounded-md bg-white/10 text-white disabled:opacity-50 hover:bg-white/15"
                  >
                    Zoom -
                  </button>
                  <a
                    href={imageModalUrl}
                    download={imageModalName ?? 'image'}
                    target="_blank"
                    className="px-2 py-1 text-xs rounded-md bg-blue-600 text-white hover:bg-blue-700"
                  >
                    Download
                  </a>
                  <button
                    type="button"
                    onClick={closeImageModal}
                    className="px-2 py-1 text-xs rounded-md bg-white/10 text-white hover:bg-white/15"
                  >
                    Close
                  </button>
                </div>
              </div>

              <div className="flex-1 flex items-center justify-center overflow-auto bg-black/60">
                <img
                  src={imageModalUrl}
                  alt={imageModalName ?? 'attachment'}
                  style={{
                    transform: `scale(${imageModalZoom})`,
                    transformOrigin: 'center center',
                  }}
                  className="max-w-none max-h-[calc(90vh-140px)] object-contain select-none"
                />
              </div>

              <div className="px-3 py-2 border-t border-white/10 flex items-center justify-between text-xs text-white/70">
                <span>Zoom: {Math.round(imageModalZoom * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setImageModalZoom(1)}
                  className="underline hover:text-white"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
