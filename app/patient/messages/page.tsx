'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { socketService } from '@/lib/socket';
import { useAuthStore } from '@/store/useAuthStore';
import { Message, User } from '@/types';
import { Search, Send, Image as ImageIcon, MessageSquare, Video } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function MessagesPage() {
  const { user } = useAuthStore();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations/contacts based on user role
  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      // In a real scenario, this would be a specific endpoint like /messages/contacts
      // We'll mock it for now with /providers if patient, or /patients if provider
      // since the prompt says "one-to-one chat between patient-provider"
      const endpoint = user?.role === 'patient' ? '/providers' : '/dashboard'; // Using dashboard just to get some users, ideally we need a chat contacts endpoint
      const res = await api.get(endpoint);
      
      if (user?.role === 'patient') {
        return res.data; // Array of providers
      } else {
        // If provider, extract patients from consultations
        const patientsMap = new Map();
        res.data.todayConsultations?.forEach((c: any) => patientsMap.set(c.patientId, { id: c.patientId, user: c.patient }));
        res.data.pendingRequests?.forEach((c: any) => patientsMap.set(c.patientId, { id: c.patientId, user: c.patient }));
        return Array.from(patientsMap.values());
      }
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedUserId) return;

    const payload = {
      receiverId: selectedUserId,
      messageText
    };

    // Optimistic UI update could be added here
    try {
      const res = await api.post('/messages', payload);
      // Backend should broadcast 'message:received' to us as well, or we append directly
      setMessages((prev) => [...prev, res.data]);
      setMessageText('');
      setTimeout(scrollToBottom, 100);
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

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
              className="block w-full py-2 pl-10 pr-3 border border-gray-300 rounded-md shadow-sm bg-gray-50 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          {loadingContacts ? (
            <div className="p-4 text-center text-sm text-gray-500">Loading contacts...</div>
          ) : (
             <ul className="divide-y divide-gray-100">
              {contacts.map((contact: any) => {
                // If patient, the contact is a Provider so UserId is contact.userId, 
                // but the prompt API might expect contact.userId or contact.user.id
                const contactUserId = contact.userId || contact.id;
                const contactName = contact.user?.fullName || 'Unknown';
                const isSelected = selectedUserId === contactUserId;

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
                        <p className="text-xs text-gray-500 truncate">{user?.role === 'patient' ? contact.specialization : 'Patient'}</p>
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
              <Link
                href={`/video/chat-${[selectedUserId, user?.id].sort().join('-')}`}
                className="inline-flex items-center px-3 py-1.5 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <Video className="w-4 h-4 mr-2" />
                Video Call
              </Link>
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
                      <div className={`max-w-[70%] rounded-lg p-3 ${isMine ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white border border-gray-200 text-gray-900 rounded-bl-none shadow-sm'}`}>
                        {msg.messageText && <p className="text-sm">{msg.messageText}</p>}
                        {msg.imageUrl && (
                          <img src={msg.imageUrl} alt="attachment" className="mt-2 rounded max-w-full h-auto" />
                        )}
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
                <button type="button" className="p-2 text-gray-400 rounded-full hover:text-gray-600 hover:bg-gray-100 focus:outline-none">
                  <ImageIcon className="w-5 h-5" />
                </button>
                <div className="flex-1">
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
                  disabled={!messageText.trim()}
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
      </div>
    </div>
  );
}
