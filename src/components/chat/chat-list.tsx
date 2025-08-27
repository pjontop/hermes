/**
 * Chat List Component
 * Shows the list of user's chats with latest messages
 */

'use client';

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, MessageCircle, Users } from 'lucide-react';
import { Chat } from '@/lib/socket';
import { ChatAPI } from '@/lib/chat-api';
import { format } from 'date-fns';

interface ChatListProps {
  selectedChatId?: string;
  onChatSelect: (chat: Chat) => void;
  onNewChat: () => void;
}

export function ChatList({ selectedChatId, onChatSelect, onNewChat }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      setLoading(true);
      const response = await ChatAPI.getChats();
      setChats(response.chats);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load chats');
    } finally {
      setLoading(false);
    }
  };

  const getChatDisplayName = (chat: Chat) => {
    if (chat.type === 'GROUP') {
      return chat.name || 'Group Chat';
    }
    
    // For direct messages, show the other user's name
    const otherMember = chat.members.find(member => member.user.name !== 'Current User'); // TODO: Get current user
    return otherMember?.user.name || 'Direct Message';
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.type === 'GROUP') {
      return null; // Will show group icon
    }
    
    const otherMember = chat.members.find(member => member.user.name !== 'Current User'); // TODO: Get current user
    return otherMember?.user.avatar;
  };

  const formatLastMessage = (message: any) => {
    if (!message) return 'No messages yet';
    
    const content = message.encryptedContent;
    const preview = content.length > 50 ? content.substring(0, 50) + '...' : content;
    return preview;
  };

  const formatLastMessageTime = (message: any) => {
    if (!message) return '';
    
    try {
      return format(new Date(message.createdAt), 'HH:mm');
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-muted-foreground">Loading chats...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="text-sm text-destructive mb-2">{error}</div>
        <Button onClick={loadChats} variant="outline" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold">Chats</h2>
        <Button onClick={onNewChat} size="sm" variant="ghost">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        {chats.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">No chats yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Start a conversation with someone
            </p>
            <Button onClick={onNewChat} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </Button>
          </div>
        ) : (
          <div className="p-2">
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent ${
                  selectedChatId === chat.id ? 'bg-accent' : ''
                }`}
                onClick={() => onChatSelect(chat)}
              >
                {/* Avatar */}
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={getChatAvatar(chat) || undefined} />
                    <AvatarFallback>
                      {chat.type === 'GROUP' ? (
                        <Users className="h-4 w-4" />
                      ) : (
                        getChatDisplayName(chat).charAt(0).toUpperCase()
                      )}
                    </AvatarFallback>
                  </Avatar>
                  {chat.type === 'GROUP' && (
                    <Badge
                      className="absolute -top-1 -right-1 h-4 w-4 text-xs p-0 flex items-center justify-center"
                      variant="secondary"
                    >
                      {chat.members.length}
                    </Badge>
                  )}
                </div>

                {/* Chat Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-medium truncate">
                      {getChatDisplayName(chat)}
                    </p>
                    <span className="text-xs text-muted-foreground">
                      {formatLastMessageTime(chat.messages[0])}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {formatLastMessage(chat.messages[0])}
                  </p>
                </div>

                {/* Unread indicator */}
                {/* TODO: Add unread count */}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
