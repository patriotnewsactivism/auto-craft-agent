import { useState, useEffect } from 'react';
import { Users, Wifi, WifiOff, MessageSquare, Copy, Check } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Separator } from './ui/separator';
import { useToast } from '@/hooks/use-toast';
import { collaborationService, User, CollaborationEvent } from '@/lib/collaborationService';

export const CollaborationPanel = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [room, setRoom] = useState<any>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [serverUrl, setServerUrl] = useState('http://localhost:3001');
  const [userName, setUserName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load saved settings
    const savedName = localStorage.getItem('collab_username') || 'User';
    setUserName(savedName);

    // Listen to collaboration events
    const unsubscribe = collaborationService.on('all', handleEvent);

    return () => {
      unsubscribe;
      if (isConnected) {
        collaborationService.disconnect();
      }
    };
  }, []);

  const handleEvent = (event: CollaborationEvent) => {
    switch (event.type) {
      case 'user-joined':
        toast({
          title: 'User Joined',
          description: `${event.user.name} joined the room`,
        });
        updateUsers();
        break;

      case 'user-left':
        toast({
          title: 'User Left',
          description: `${event.user.name} left the room`,
        });
        updateUsers();
        break;

      case 'chat-message':
        setMessages(prev => [...prev, {
          user: event.user,
          message: event.data,
          timestamp: event.timestamp,
        }]);
        break;
    }
  };

  const updateUsers = () => {
    const roomUsers = collaborationService.getRoomUsers();
    setUsers(roomUsers);
  };

  const handleConnect = async () => {
    try {
      localStorage.setItem('collab_username', userName);
      await collaborationService.connect(serverUrl, userName);
      setIsConnected(true);
      
      toast({
        title: 'Connected',
        description: 'Successfully connected to collaboration server',
      });
    } catch (error) {
      toast({
        title: 'Connection Failed',
        description: 'Could not connect to server. Is it running?',
        variant: 'destructive',
      });
    }
  };

  const handleJoinRoom = async () => {
    try {
      const roomInfo = await collaborationService.joinRoom(roomId);
      setRoom(roomInfo);
      updateUsers();
      
      toast({
        title: 'Joined Room',
        description: `You're now in room: ${roomId}`,
      });
    } catch (error) {
      toast({
        title: 'Failed to Join',
        description: 'Could not join room',
        variant: 'destructive',
      });
    }
  };

  const handleLeaveRoom = () => {
    collaborationService.leaveRoom();
    setRoom(null);
    setUsers([]);
    setMessages([]);
    
    toast({
      title: 'Left Room',
      description: 'You left the collaboration room',
    });
  };

  const handleDisconnect = () => {
    collaborationService.disconnect();
    setIsConnected(false);
    setRoom(null);
    setUsers([]);
    
    toast({
      title: 'Disconnected',
      description: 'Disconnected from collaboration server',
    });
  };

  const handleSendMessage = () => {
    if (!chatMessage.trim()) return;

    collaborationService.sendChatMessage(chatMessage);
    setChatMessage('');
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    
    toast({
      title: 'Copied',
      description: 'Room ID copied to clipboard',
    });
  };

  const generateRoomId = () => {
    const id = Math.random().toString(36).substr(2, 9);
    setRoomId(id);
  };

  if (!isConnected) {
    return (
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <WifiOff className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">Real-time Collaboration</h3>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Your Name</label>
            <Input
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Server URL</label>
            <Input
              value={serverUrl}
              onChange={(e) => setServerUrl(e.target.value)}
              placeholder="http://localhost:3001"
            />
          </div>

          <Button onClick={handleConnect} className="w-full">
            Connect to Server
          </Button>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>💡 To use collaboration, you need a WebSocket server running.</p>
          <p>See documentation for setup instructions.</p>
        </div>
      </Card>
    );
  }

  if (!room) {
    return (
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold">Connected</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={handleDisconnect}>
            Disconnect
          </Button>
        </div>

        <Separator />

        <div className="space-y-3">
          <div>
            <label className="text-sm font-medium">Room ID</label>
            <div className="flex gap-2">
              <Input
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                placeholder="Enter room ID"
              />
              <Button variant="outline" size="sm" onClick={generateRoomId}>
                Generate
              </Button>
            </div>
          </div>

          <Button onClick={handleJoinRoom} className="w-full" disabled={!roomId}>
            Join Room
          </Button>
        </div>

        <div className="text-xs text-muted-foreground">
          <p>Create a new room or join an existing one to start collaborating.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-4 space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Wifi className="h-5 w-5 text-green-500" />
            <h3 className="font-semibold">Room: {room.id}</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyRoomId}
              className="h-6 w-6 p-0"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            {users.length} user{users.length !== 1 ? 's' : ''} online
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLeaveRoom}>
          Leave
        </Button>
      </div>

      <Separator />

      {/* Users List */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Participants</span>
        </div>
        <ScrollArea className="h-32">
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback style={{ backgroundColor: user.color }}>
                    {user.name[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{user.name}</span>
                {user.id === collaborationService.getCurrentUser()?.id && (
                  <Badge variant="secondary" className="text-xs">You</Badge>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <Separator />

      {/* Chat */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex items-center gap-2 mb-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Chat</span>
        </div>
        
        <ScrollArea className="flex-1 mb-2 border rounded p-2">
          <div className="space-y-2">
            {messages.map((msg, i) => (
              <div key={i} className="text-sm">
                <span className="font-medium" style={{ color: msg.user.color }}>
                  {msg.user.name}:
                </span>{' '}
                <span>{msg.message}</span>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button size="sm" onClick={handleSendMessage}>
            Send
          </Button>
        </div>
      </div>
    </Card>
  );
};
