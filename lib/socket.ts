import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/useAuthStore';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket) return;
    
    const token = localStorage.getItem('token');
    const user = useAuthStore.getState().user;

    if (!token || !user) return;

    this.socket = io(SOCKET_URL, {
      auth: {
        userId: user.id
      },
      extraHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    this.socket.on('connect', () => {
      console.log('Connected to socket server');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from socket server');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }
}

export const socketService = new SocketService();
