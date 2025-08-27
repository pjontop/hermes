/**
 * Chat Messages Component
 * Displays messages in a chat with real-time updates
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MoreVertical, Reply, Edit2, Trash2 } from 'lucide-react';
import { Message, Chat } from '@/lib/socket';
import { ChatAPI } from '@/lib/chat-api';
import { format, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

interface ChatMessagesProps {
  chat: Chat;
  currentUserId: string;
  onReply?: (message: Message) => void;
}

export function ChatMessages({ chat, currentUserId, onReply }: ChatMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
  }, [chat.id]);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    scrollToBottom();
  }, [messages]);

  const loadMessages = async (pageNum = 1, append = false) => {
    try {
      if (!append) setLoading(true);
      
      const response = await ChatAPI.getChatMessages(chat.id, pageNum, 50);
      
      if (append) {
        setMessages(prev => [...response.messages, ...prev]);
      } else {
        setMessages(response.messages);
      }
      
      setHasMore(response.messages.length === 50);
      setPage(pageNum);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (!hasMore || loading) return;
    await loadMessages(page + 1, true);
  };

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatMessageTime = (date: string) => {
    const messageDate = new Date(date);
    
    if (isToday(messageDate)) {
      return format(messageDate, 'HH:mm');
    } else if (isYesterday(messageDate)) {
      return `Yesterday ${format(messageDate, 'HH:mm')}`;
    } else {
      return format(messageDate, 'MMM dd, HH:mm');
    }
  };

  const formatMessageDate = (date: string) => {
    const messageDate = new Date(date);
    
    if (isToday(messageDate)) {
      return 'Today';
    } else if (isYesterday(messageDate)) {
      return 'Yesterday';
    } else {
      return format(messageDate, 'MMMM dd, yyyy');
    }
  };

  const shouldShowDateSeparator = (currentMessage: Message, previousMessage?: Message) => {
    if (!previousMessage) return true;
    
    const currentDate = new Date(currentMessage.createdAt).toDateString();
    const previousDate = new Date(previousMessage.createdAt).toDateString();
    
    return currentDate !== previousDate;
  };

  const shouldGroupMessage = (currentMessage: Message, previousMessage?: Message) => {
    if (!previousMessage) return false;
    if (currentMessage.senderId !== previousMessage.senderId) return false;
    
    const timeDiff = new Date(currentMessage.createdAt).getTime() - new Date(previousMessage.createdAt).getTime();
    return timeDiff < 5 * 60 * 1000; // 5 minutes
  };

  if (loading && messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-sm text-muted-foreground">Loading messages...</div>
      </div>
    );
  }

  if (error && messages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="text-sm text-destructive mb-2">{error}</div>
        <Button onClick={() => loadMessages()} variant="outline" size="sm">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Avatar className="h-8 w-8">
          <AvatarImage src={chat.members[0]?.user.avatar} />
          <AvatarFallback>
            {chat.type === 'GROUP' ? '👥' : chat.members[0]?.user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-medium">
            {chat.type === 'GROUP' ? 
              chat.name || 'Group Chat' : 
              chat.members.find(m => m.user.id !== currentUserId)?.user.name || 'Direct Message'
            }
          </h3>
          <p className="text-xs text-muted-foreground">
            {chat.members.length} member{chat.members.length > 1 ? 's' : ''}
          </p>
        </div>
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 space-y-4">
          {/* Load more button */}
          {hasMore && (
            <div className="text-center">
              <Button
                onClick={loadMoreMessages}
                variant="ghost"
                size="sm"
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load more messages'}
              </Button>
            </div>
          )}

          {/* Messages */}
          {messages.map((message, index) => {
            const previousMessage = index > 0 ? messages[index - 1] : undefined;
            const isOwnMessage = message.senderId === currentUserId;
            const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
            const groupWithPrevious = shouldGroupMessage(message, previousMessage);

            return (
              <div key={message.id}>
                {/* Date separator */}
                {showDateSeparator && (
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground">
                      {formatMessageDate(message.createdAt)}
                    </div>
                  </div>
                )}

                {/* Message */}
                <div className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}>
                  {/* Avatar */}
                  {!groupWithPrevious && !isOwnMessage && (
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={message.sender.avatar} />
                      <AvatarFallback>
                        {message.sender.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {(groupWithPrevious || isOwnMessage) && !isOwnMessage && (
                    <div className="w-8" />
                  )}

                  {/* Message content */}
                  <div className={`flex-1 max-w-[70%] ${groupWithPrevious ? 'mt-1' : 'mt-0'}`}>
                    {!groupWithPrevious && !isOwnMessage && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">{message.sender.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatMessageTime(message.createdAt)}
                        </span>
                      </div>
                    )}

                    {/* Reply indicator */}
                    {message.replyTo && (
                      <div className="mb-2 p-2 bg-muted rounded border-l-2 border-primary text-sm">
                        <div className="text-xs text-muted-foreground mb-1">
                          Replying to {message.replyTo.sender.name}
                        </div>
                        <div className="truncate">
                          {message.replyTo.encryptedContent}
                        </div>
                      </div>
                    )}

                    {/* Message bubble */}
                    <div
                      className={`group relative rounded-lg px-3 py-2 ${
                        isOwnMessage
                          ? 'bg-primary text-primary-foreground ml-auto'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap break-words">
                        {message.encryptedContent}
                      </div>

                      {/* Message actions */}
                      <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity ${
                        isOwnMessage ? '-left-12' : '-right-12'
                      }`}>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => onReply?.(message)}
                          >
                            <Reply className="h-3 w-3" />
                          </Button>
                          {isOwnMessage && (
                            <>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Edit indicator */}
                      {message.isEdited && (
                        <div className="text-xs opacity-70 mt-1">
                          (edited)
                        </div>
                      )}

                      {/* Time for own messages */}
                      {(isOwnMessage || groupWithPrevious) && (
                        <div className={`text-xs opacity-70 mt-1 ${
                          isOwnMessage ? 'text-right' : ''
                        }`}>
                          {formatMessageTime(message.createdAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Bottom reference for auto-scroll */}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  );
}
