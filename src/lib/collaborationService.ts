import { io, Socket } from 'socket.io-client';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { logger } from './logger';

/**
 * Real-time Collaboration Service
 * Enables multiplayer editing with live cursors, presence, and synchronized changes
 */

export interface User {
  id: string;
  name: string;
  color: string;
  cursor?: {
    line: number;
    column: number;
  };
  selection?: {
    start: { line: number; column: number };
    end: { line: number; column: number };
  };
}

export interface RoomInfo {
  id: string;
  name: string;
  users: User[];
  fileCount: number;
  createdAt: number;
}

export interface CollaborationEvent {
  type: 'user-joined' | 'user-left' | 'cursor-move' | 'file-change' | 'chat-message';
  user: User;
  data?: any;
  timestamp: number;
}

export class CollaborationService {
  private socket: Socket | null = null;
  private ydoc: Y.Doc;
  private provider: WebsocketProvider | null = null;
  private currentUser: User | null = null;
  private room: RoomInfo | null = null;
  private eventHandlers: Map<string, Set<(event: CollaborationEvent) => void>>;
  private connected: boolean = false;

  constructor() {
    this.ydoc = new Y.Doc();
    this.eventHandlers = new Map();
  }

  /**
   * Generate random user color
   */
  private generateUserColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
      '#F8B739', '#52B788', '#E76F51', '#2A9D8F'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Connect to collaboration server
   */
  async connect(serverUrl: string, userName: string): Promise<void> {
    try {
      logger.info('Collaboration', 'Connecting to server', serverUrl);

      // Initialize socket connection
      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: Infinity,
      });

      // Set up current user
      this.currentUser = {
        id: this.generateUserId(),
        name: userName || 'Anonymous',
        color: this.generateUserColor(),
      };

      // Set up socket event handlers
      this.setupSocketHandlers();

      // Wait for connection
      await new Promise<void>((resolve, reject) => {
        this.socket!.once('connect', () => {
          this.connected = true;
          logger.info('Collaboration', 'Connected to server');
          resolve();
        });

        this.socket!.once('connect_error', (error) => {
          logger.error('Collaboration', 'Connection failed', error.message);
          reject(error);
        });

        setTimeout(() => reject(new Error('Connection timeout')), 10000);
      });

    } catch (error) {
      logger.error('Collaboration', 'Connection error', error);
      throw error;
    }
  }

  /**
   * Join a collaboration room
   */
  async joinRoom(roomId: string, roomName?: string): Promise<RoomInfo> {
    if (!this.socket || !this.connected) {
      throw new Error('Not connected to server');
    }

    return new Promise((resolve, reject) => {
      this.socket!.emit('join-room', {
        roomId,
        roomName: roomName || `Room ${roomId}`,
        user: this.currentUser,
      }, (response: any) => {
        if (response.error) {
          logger.error('Collaboration', 'Failed to join room', response.error);
          reject(new Error(response.error));
        } else {
          this.room = response.room;
          logger.info('Collaboration', 'Joined room', this.room);
          
          // Initialize Yjs provider for CRDT sync
          this.setupYjsProvider(roomId);
          
          resolve(this.room!);
        }
      });
    });
  }

  /**
   * Set up Yjs provider for CRDT synchronization
   */
  private setupYjsProvider(roomId: string): void {
    // Note: This would connect to a Yjs WebSocket server
    // For demo purposes, we're showing the structure
    try {
      // In production, use a real Yjs WebSocket server
      const wsUrl = 'ws://localhost:1234'; // Would be configurable
      
      this.provider = new WebsocketProvider(
        wsUrl,
        roomId,
        this.ydoc
      );

      this.provider.on('status', (event: any) => {
        logger.debug('Collaboration', 'Yjs provider status', event.status);
      });

      logger.info('Collaboration', 'Yjs provider initialized');
    } catch (error) {
      // Yjs provider is optional - collaboration can work with Socket.io alone
      logger.warn('Collaboration', 'Yjs provider not available, using Socket.io only');
    }
  }

  /**
   * Set up socket event handlers
   */
  private setupSocketHandlers(): void {
    if (!this.socket) return;

    this.socket.on('user-joined', (data: any) => {
      logger.info('Collaboration', 'User joined', data.user.name);
      this.emitEvent({
        type: 'user-joined',
        user: data.user,
        timestamp: Date.now(),
      });
    });

    this.socket.on('user-left', (data: any) => {
      logger.info('Collaboration', 'User left', data.user.name);
      this.emitEvent({
        type: 'user-left',
        user: data.user,
        timestamp: Date.now(),
      });
    });

    this.socket.on('cursor-move', (data: any) => {
      this.emitEvent({
        type: 'cursor-move',
        user: data.user,
        data: data.cursor,
        timestamp: Date.now(),
      });
    });

    this.socket.on('file-change', (data: any) => {
      logger.debug('Collaboration', 'File changed', data.path);
      this.emitEvent({
        type: 'file-change',
        user: data.user,
        data: { path: data.path, change: data.change },
        timestamp: Date.now(),
      });
    });

    this.socket.on('chat-message', (data: any) => {
      this.emitEvent({
        type: 'chat-message',
        user: data.user,
        data: data.message,
        timestamp: Date.now(),
      });
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
      logger.warn('Collaboration', 'Disconnected from server');
    });

    this.socket.on('reconnect', () => {
      this.connected = true;
      logger.info('Collaboration', 'Reconnected to server');
      
      // Rejoin room if we were in one
      if (this.room) {
        this.joinRoom(this.room.id, this.room.name);
      }
    });
  }

  /**
   * Leave current room
   */
  leaveRoom(): void {
    if (this.socket && this.room) {
      this.socket.emit('leave-room', {
        roomId: this.room.id,
        userId: this.currentUser?.id,
      });
      this.room = null;
      
      if (this.provider) {
        this.provider.destroy();
        this.provider = null;
      }
      
      logger.info('Collaboration', 'Left room');
    }
  }

  /**
   * Disconnect from server
   */
  disconnect(): void {
    this.leaveRoom();
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      logger.info('Collaboration', 'Disconnected');
    }
  }

  /**
   * Send cursor position
   */
  sendCursor(line: number, column: number): void {
    if (!this.socket || !this.room) return;

    const cursor = { line, column };
    this.socket.emit('cursor-move', {
      roomId: this.room.id,
      user: this.currentUser,
      cursor,
    });
  }

  /**
   * Send file change
   */
  sendFileChange(path: string, change: any): void {
    if (!this.socket || !this.room) return;

    this.socket.emit('file-change', {
      roomId: this.room.id,
      user: this.currentUser,
      path,
      change,
    });
  }

  /**
   * Send chat message
   */
  sendChatMessage(message: string): void {
    if (!this.socket || !this.room) return;

    this.socket.emit('chat-message', {
      roomId: this.room.id,
      user: this.currentUser,
      message,
    });
  }

  /**
   * Get Yjs document for CRDT operations
   */
  getYDoc(): Y.Doc {
    return this.ydoc;
  }

  /**
   * Get shared text type for a file (CRDT)
   */
  getSharedText(filePath: string): Y.Text {
    return this.ydoc.getText(filePath);
  }

  /**
   * Listen to collaboration events
   */
  on(eventType: string, handler: (event: CollaborationEvent) => void): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, new Set());
    }
    this.eventHandlers.get(eventType)!.add(handler);
  }

  /**
   * Stop listening to events
   */
  off(eventType: string, handler: (event: CollaborationEvent) => void): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * Emit event to handlers
   */
  private emitEvent(event: CollaborationEvent): void {
    const handlers = this.eventHandlers.get(event.type);
    if (handlers) {
      handlers.forEach(handler => handler(event));
    }

    // Also emit to 'all' handlers
    const allHandlers = this.eventHandlers.get('all');
    if (allHandlers) {
      allHandlers.forEach(handler => handler(event));
    }
  }

  /**
   * Generate unique user ID
   */
  private generateUserId(): string {
    return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get current room
   */
  getCurrentRoom(): RoomInfo | null {
    return this.room;
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get users in current room
   */
  getRoomUsers(): User[] {
    return this.room?.users || [];
  }
}

// Export singleton instance
export const collaborationService = new CollaborationService();
