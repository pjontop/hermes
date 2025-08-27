/**
 * Chat Input Component
 * Handles message composition with typing indicators and E2E encryption
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Paperclip, Smile, X } from 'lucide-react';
import { getChatSocket, Message } from '@/lib/socket';

interface ChatInputProps {
  chatId: string;
  replyingTo?: Message | null;
  onCancelReply?: () => void;
  onMessageSent?: () => void;
}

export function ChatInput({ chatId, replyingTo, onCancelReply, onMessageSent }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const chatSocket = getChatSocket();

  useEffect(() => {
    // Auto-focus the input
    textareaRef.current?.focus();
  }, [chatId]);

  useEffect(() => {
    // Handle typing indicators
    if (message.trim() && !isTyping) {
      setIsTyping(true);
      chatSocket.startTyping(chatId);
    }

    // Clear typing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      if (isTyping) {
        setIsTyping(false);
        chatSocket.stopTyping(chatId);
      }
    }, 2000);

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [message, chatId, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSending) return;

    try {
      setIsSending(true);
      
      // Stop typing indicator
      if (isTyping) {
        setIsTyping(false);
        chatSocket.stopTyping(chatId);
      }

      // Send message
      await chatSocket.sendMessage(
        chatId,
        trimmedMessage,
        replyingTo?.id
      );

      // Clear input
      setMessage('');
      onCancelReply?.();
      onMessageSent?.();

      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // TODO: Show error toast
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = 'auto';
    const newHeight = Math.min(textarea.scrollHeight, 120); // Max height ~6 lines
    textarea.style.height = `${newHeight}px`;
  };

  return (
    <div className="border-t bg-background">
      {/* Reply indicator */}
      {replyingTo && (
        <div className="px-4 py-2 bg-muted/50 border-b flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="text-xs text-muted-foreground mb-1">
              Replying to {replyingTo.sender.name}
            </div>
            <div className="text-sm truncate">
              {replyingTo.encryptedContent}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancelReply}
            className="h-6 w-6 p-0 ml-2"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Input area */}
      <form onSubmit={handleSubmit} className="p-4">
        <div className="flex items-end gap-2">
          {/* Attachment button */}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 shrink-0"
            disabled
          >
            <Paperclip className="h-4 w-4" />
          </Button>

          {/* Message input */}
          <div className="flex-1 relative">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder="Type a message..."
              className="min-h-[40px] max-h-[120px] resize-none pr-16"
              disabled={isSending}
            />
            
            {/* Emoji button */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2 h-6 w-6 p-0"
              disabled
            >
              <Smile className="h-4 w-4" />
            </Button>
          </div>

          {/* Send button */}
          <Button
            type="submit"
            size="sm"
            className="h-8 w-8 p-0 shrink-0"
            disabled={!message.trim() || isSending}
          >
            {isSending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Character count or status */}
        <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
          <div>
            {isTyping && 'Typing...'}
          </div>
          <div>
            {message.length > 500 && (
              <span className={message.length > 1000 ? 'text-destructive' : ''}>
                {message.length}/1000
              </span>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
