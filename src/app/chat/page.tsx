/**
 * Main Chat Page
 * The main chat interface with list, messages, and input
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatList } from '@/components/chat/chat-list';
import { ChatMessages } from '@/components/chat/chat-messages';
import { ChatInput } from '@/components/chat/chat-input';
import { NewChatDialog } from '@/components/chat/new-chat-dialog';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { MessageCircle, Menu, Settings, LogOut } from 'lucide-react';
import { Chat, Message, getChatSocket } from '@/lib/socket';
import { ChatAPI } from '@/lib/chat-api';
import { verifyToken } from '@/lib/auth';

export default function ChatPage() {
  const router = useRouter();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showNewChatDialog, setShowNewChatDialog] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const chatSocket = getChatSocket();

  useEffect(() => {
    initializeChat();

    return () => {
      chatSocket.disconnect();
    };
  }, []);

  const initializeChat = async () => {
    try {
      setIsConnecting(true);
      
      // Get token from localStorage or cookie
      const token = localStorage.getItem('token') || getCookieValue('token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      // Verify token and get user info
      const user = verifyToken(token);
      if (!user) {
        router.push('/auth/login');
        return;
      }

      setCurrentUser(user);

      // Set up API token
      ChatAPI.setToken(token);

      // Connect to socket
      chatSocket.connect(token);

      // Set up encryption (you might want to prompt for a password here)
      const encryptionSetup = await chatSocket.setupEncryption('default-password'); // TODO: Use proper password
      if (!encryptionSetup) {
        throw new Error('Failed to set up encryption');
      }

      // Set up socket event handlers
      chatSocket.onMessage((message) => {
        console.log('New message received:', message);
        // The ChatMessages component will handle updating the UI
      });

      chatSocket.onSocketError((error) => {
        console.error('Socket error:', error);
        setError(error.message);
      });

      setError(null);
    } catch (err) {
      console.error('Error initializing chat:', err);
      setError(err instanceof Error ? err.message : 'Failed to initialize chat');
      
      // If initialization fails, redirect to login
      setTimeout(() => {
        router.push('/auth/login');
      }, 3000);
    } finally {
      setIsConnecting(false);
    }
  };

  const getCookieValue = (name: string) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };

  const handleChatSelect = async (chat: Chat) => {
    setSelectedChat(chat);
    setReplyingTo(null);
    
    // Join the chat
    await chatSocket.joinChat(chat.id);
  };

  const handleNewChat = () => {
    setShowNewChatDialog(true);
  };

  const handleChatCreated = (newChat: Chat) => {
    setSelectedChat(newChat);
  };

  const handleReply = (message: Message) => {
    setReplyingTo(message);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    chatSocket.disconnect();
    router.push('/auth/login');
  };

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Connecting to chat...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-destructive text-lg">⚠️ Connection Error</div>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-10 bg-background border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-80">
              <ChatList
                selectedChatId={selectedChat?.id}
                onChatSelect={handleChatSelect}
                onNewChat={handleNewChat}
              />
            </SheetContent>
          </Sheet>
          <h1 className="font-semibold">Hermes</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" disabled>
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-80 border-r bg-muted/10">
        <ChatList
          selectedChatId={selectedChat?.id}
          onChatSelect={handleChatSelect}
          onNewChat={handleNewChat}
        />
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col lg:mt-0 mt-16">
        {selectedChat ? (
          <>
            {/* Messages */}
            <div className="flex-1">
              <ChatMessages
                chat={selectedChat}
                currentUserId={currentUser?.userId || ''}
                onReply={handleReply}
              />
            </div>

            {/* Input */}
            <ChatInput
              chatId={selectedChat.id}
              replyingTo={replyingTo}
              onCancelReply={handleCancelReply}
              onMessageSent={() => {
                // Could trigger a refresh or update
              }}
            />
          </>
        ) : (
          /* No Chat Selected */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                <MessageCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">Welcome to Hermes</h3>
              <p className="text-muted-foreground">
                Select a chat from the sidebar to start messaging, or create a new chat to begin a conversation.
              </p>
              <Button onClick={handleNewChat}>
                Start New Chat
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Dialog */}
      <NewChatDialog
        open={showNewChatDialog}
        onOpenChange={setShowNewChatDialog}
        onChatCreated={handleChatCreated}
      />

      {/* Desktop Header/Status */}
      <div className="hidden lg:block fixed top-4 right-4 z-10">
        <div className="flex items-center gap-2">
          <div className="text-sm text-muted-foreground">
            {currentUser?.name}
          </div>
          <Button variant="ghost" size="sm" disabled>
            <Settings className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
