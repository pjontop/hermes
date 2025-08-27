/**
 * New Chat Dialog Component
 * Allows users to create new direct messages or group chats
 */

'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, X, Users, MessageCircle } from 'lucide-react';
import { ChatAPI } from '@/lib/chat-api';
import { Chat } from '@/lib/socket';

interface NewChatDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChatCreated: (chat: Chat) => void;
}

export function NewChatDialog({ open, onOpenChange, onChatCreated }: NewChatDialogProps) {
  const [chatType, setChatType] = useState<'DIRECT' | 'GROUP'>('DIRECT');
  const [chatName, setChatName] = useState('');
  const [chatDescription, setChatDescription] = useState('');
  const [memberEmails, setMemberEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setChatType('DIRECT');
    setChatName('');
    setChatDescription('');
    setMemberEmails([]);
    setEmailInput('');
    setError(null);
  };

  const handleClose = () => {
    onOpenChange(false);
    resetForm();
  };

  const addEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (memberEmails.includes(email)) {
      setError('This email is already added');
      return;
    }

    setMemberEmails([...memberEmails, email]);
    setEmailInput('');
    setError(null);
  };

  const removeEmail = (emailToRemove: string) => {
    setMemberEmails(memberEmails.filter(email => email !== emailToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addEmail();
    }
  };

  const handleCreate = async () => {
    if (memberEmails.length === 0) {
      setError('Please add at least one member');
      return;
    }

    if (chatType === 'GROUP' && !chatName.trim()) {
      setError('Please enter a group name');
      return;
    }

    try {
      setIsCreating(true);
      setError(null);

      const response = await ChatAPI.createChat({
        type: chatType,
        name: chatType === 'GROUP' ? chatName.trim() : undefined,
        memberEmails,
      });

      onChatCreated(response.chat);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create chat');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Chat</DialogTitle>
          <DialogDescription>
            Start a conversation with someone or create a group chat.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Chat Type Selection */}
          <div className="space-y-2">
            <Label>Chat Type</Label>
            <div className="flex gap-2">
              <Button
                variant={chatType === 'DIRECT' ? 'default' : 'outline'}
                onClick={() => setChatType('DIRECT')}
                className="flex-1"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Direct Message
              </Button>
              <Button
                variant={chatType === 'GROUP' ? 'default' : 'outline'}
                onClick={() => setChatType('GROUP')}
                className="flex-1"
              >
                <Users className="h-4 w-4 mr-2" />
                Group Chat
              </Button>
            </div>
          </div>

          {/* Group Chat Name */}
          {chatType === 'GROUP' && (
            <div className="space-y-2">
              <Label htmlFor="chat-name">Group Name</Label>
              <Input
                id="chat-name"
                value={chatName}
                onChange={(e) => setChatName(e.target.value)}
                placeholder="Enter group name"
              />
            </div>
          )}

          {/* Group Description (optional) */}
          {chatType === 'GROUP' && (
            <div className="space-y-2">
              <Label htmlFor="chat-description">Description (optional)</Label>
              <Textarea
                id="chat-description"
                value={chatDescription}
                onChange={(e) => setChatDescription(e.target.value)}
                placeholder="Describe what this group is about"
                className="resize-none"
                rows={2}
              />
            </div>
          )}

          {/* Add Members */}
          <div className="space-y-2">
            <Label htmlFor="email-input">
              {chatType === 'DIRECT' ? 'User Email' : 'Member Emails'}
            </Label>
            <div className="flex gap-2">
              <Input
                id="email-input"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Enter email address"
                type="email"
              />
              <Button onClick={addEmail} variant="outline" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Selected Members */}
          {memberEmails.length > 0 && (
            <div className="space-y-2">
              <Label>
                {chatType === 'DIRECT' ? 'Recipient' : 'Members'} ({memberEmails.length})
              </Label>
              <div className="flex flex-wrap gap-2">
                {memberEmails.map((email) => (
                  <Badge key={email} variant="secondary" className="pr-1">
                    <Avatar className="h-4 w-4 mr-1">
                      <AvatarFallback className="text-xs">
                        {email.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {email}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-4 w-4 p-0 ml-1 hover:bg-destructive/20"
                      onClick={() => removeEmail(email)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-4">
          <Button variant="outline" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isCreating || memberEmails.length === 0}
            className="flex-1"
          >
            {isCreating ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
            ) : null}
            Create Chat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
