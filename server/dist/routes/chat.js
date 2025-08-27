"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatRoutes = void 0;
const express_1 = require("express");
const prisma_1 = require("../generated/prisma");
const router = (0, express_1.Router)();
exports.chatRoutes = router;
const prisma = new prisma_1.PrismaClient();
// Get user's chats
router.get('/chats', async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not found' });
        }
        // Find user in our database
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found in chat system' });
        }
        const chats = await prisma.chat.findMany({
            where: {
                members: {
                    some: {
                        userId: user.id,
                        leftAt: null
                    }
                },
                isActive: true
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                avatar: true
                            }
                        }
                    },
                    where: {
                        leftAt: null
                    }
                },
                messages: {
                    take: 1,
                    orderBy: {
                        createdAt: 'desc'
                    },
                    select: {
                        id: true,
                        encryptedContent: true,
                        createdAt: true,
                        sender: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });
        res.json({ chats });
    }
    catch (error) {
        console.error('Error fetching chats:', error);
        res.status(500).json({ error: 'Failed to fetch chats' });
    }
});
// Get chat messages
router.get('/chats/:chatId/messages', async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user?.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        if (!userId) {
            return res.status(401).json({ error: 'User not found' });
        }
        // Find user in our database
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found in chat system' });
        }
        // Verify user is a member of this chat
        const membership = await prisma.chatMember.findFirst({
            where: {
                chatId,
                userId: user.id,
                leftAt: null
            }
        });
        if (!membership) {
            return res.status(403).json({ error: 'Access denied to this chat' });
        }
        const messages = await prisma.message.findMany({
            where: {
                chatId,
                deletedAt: null
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatar: true
                    }
                },
                replyTo: {
                    select: {
                        id: true,
                        encryptedContent: true,
                        sender: {
                            select: {
                                name: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip: (page - 1) * limit,
            take: limit
        });
        res.json({ messages: messages.reverse() });
    }
    catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).json({ error: 'Failed to fetch messages' });
    }
});
// Create new chat
router.post('/chats', async (req, res) => {
    try {
        const { type, name, memberEmails } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not found' });
        }
        // Find user in our database
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found in chat system' });
        }
        // Find members by email
        const members = await prisma.user.findMany({
            where: {
                email: {
                    in: memberEmails
                }
            }
        });
        if (members.length !== memberEmails.length) {
            return res.status(400).json({ error: 'Some users not found' });
        }
        // Create chat
        const chat = await prisma.chat.create({
            data: {
                type: type || 'DIRECT',
                name: type === 'GROUP' ? name : null,
                members: {
                    create: [
                        {
                            userId: user.id,
                            role: 'OWNER'
                        },
                        ...members
                            .filter((member) => member.id !== user.id)
                            .map((member) => ({
                            userId: member.id,
                            role: 'MEMBER'
                        }))
                    ]
                }
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                avatar: true,
                                publicKey: true
                            }
                        }
                    }
                }
            }
        });
        res.json({ chat });
    }
    catch (error) {
        console.error('Error creating chat:', error);
        res.status(500).json({ error: 'Failed to create chat' });
    }
});
// Get chat keys for encryption
router.get('/chats/:chatId/keys', async (req, res) => {
    try {
        const { chatId } = req.params;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not found' });
        }
        // Find user in our database
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found in chat system' });
        }
        // Get user's key for this chat
        const keyExchange = await prisma.keyExchange.findFirst({
            where: {
                chatId,
                userId: user.id
            },
            orderBy: {
                keyVersion: 'desc'
            }
        });
        // Get all members' public keys
        const chat = await prisma.chat.findUnique({
            where: { id: chatId },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                publicKey: true
                            }
                        }
                    },
                    where: {
                        leftAt: null
                    }
                }
            }
        });
        if (!chat) {
            return res.status(404).json({ error: 'Chat not found' });
        }
        res.json({
            userKey: keyExchange?.encryptedAESKey,
            memberKeys: chat.members.map((member) => ({
                userId: member.user.id,
                name: member.user.name,
                publicKey: member.user.publicKey
            }))
        });
    }
    catch (error) {
        console.error('Error fetching chat keys:', error);
        res.status(500).json({ error: 'Failed to fetch chat keys' });
    }
});
// Store encrypted AES key for user
router.post('/chats/:chatId/keys', async (req, res) => {
    try {
        const { chatId } = req.params;
        const { encryptedAESKey } = req.body;
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'User not found' });
        }
        // Find user in our database
        const user = await prisma.user.findUnique({
            where: { id: userId }
        });
        if (!user) {
            return res.status(404).json({ error: 'User not found in chat system' });
        }
        // Store the encrypted AES key
        await prisma.keyExchange.create({
            data: {
                chatId,
                userId: user.id,
                encryptedAESKey,
                keyVersion: 1
            }
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error storing chat key:', error);
        res.status(500).json({ error: 'Failed to store chat key' });
    }
});
// Search users by email
router.get('/users/search', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email || typeof email !== 'string') {
            return res.status(400).json({ error: 'Email query parameter is required' });
        }
        const users = await prisma.user.findMany({
            where: {
                email: {
                    contains: email.toLowerCase(),
                    mode: 'insensitive'
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatar: true
            },
            take: 10
        });
        res.json({ users });
    }
    catch (error) {
        console.error('Error searching users:', error);
        res.status(500).json({ error: 'Failed to search users' });
    }
});
//# sourceMappingURL=chat.js.map