"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketHandlers = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'skibikey';
const setupSocketHandlers = (io, prisma) => {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                return next(new Error('Authentication error'));
            }
            const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
            socket.data.user = decoded;
            next();
        }
        catch (err) {
            next(new Error('Authentication error'));
        }
    });
    io.on('connection', async (socket) => {
        const user = socket.data.user;
        console.log(`🔌 User ${user.name} connected (${socket.id})`);
        // Find user in our database
        let dbUser = await prisma.user.findUnique({
            where: { id: user.userId }
        });
        if (!dbUser) {
            console.error(`User ${user.userId} not found in database`);
            socket.disconnect();
            return;
        }
        // Join user's chat rooms
        const chatMemberships = await prisma.chatMember.findMany({
            where: {
                userId: dbUser.id,
                leftAt: null
            },
            select: {
                chatId: true
            }
        });
        chatMemberships.forEach((membership) => {
            socket.join(`chat_${membership.chatId}`);
        });
        // Handle joining specific chat
        socket.on('join_chat', (chatId) => {
            socket.join(`chat_${chatId}`);
            console.log(`📱 User ${user.name} joined chat ${chatId}`);
        });
        // Handle leaving chat
        socket.on('leave_chat', (chatId) => {
            socket.leave(`chat_${chatId}`);
            console.log(`📱 User ${user.name} left chat ${chatId}`);
        });
        // Handle new message
        socket.on('send_message', async (data) => {
            try {
                // Verify user is member of chat
                const membership = await prisma.chatMember.findFirst({
                    where: {
                        chatId: data.chatId,
                        userId: dbUser.id,
                        leftAt: null
                    }
                });
                if (!membership) {
                    socket.emit('error', { message: 'Access denied to this chat' });
                    return;
                }
                // Create message
                const message = await prisma.message.create({
                    data: {
                        chatId: data.chatId,
                        senderId: dbUser.id,
                        encryptedContent: data.encryptedContent,
                        messageType: data.messageType || 'TEXT',
                        replyToId: data.replyToId
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
                    }
                });
                // Update chat's updatedAt
                await prisma.chat.update({
                    where: { id: data.chatId },
                    data: { updatedAt: new Date() }
                });
                // Broadcast to chat members
                io.to(`chat_${data.chatId}`).emit('new_message', message);
                console.log(`💬 Message sent in chat ${data.chatId} by ${user.name}`);
            }
            catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });
        // Handle typing indicators
        socket.on('typing_start', (chatId) => {
            socket.to(`chat_${chatId}`).emit('user_typing', {
                userId: dbUser.id,
                userName: user.name,
                isTyping: true
            });
        });
        socket.on('typing_stop', (chatId) => {
            socket.to(`chat_${chatId}`).emit('user_typing', {
                userId: dbUser.id,
                userName: user.name,
                isTyping: false
            });
        });
        // Handle message read receipts
        socket.on('mark_read', async (data) => {
            // This could be expanded to track read receipts
            socket.to(`chat_${data.chatId}`).emit('message_read', {
                messageId: data.messageId,
                userId: dbUser.id,
                userName: user.name
            });
        });
        // Handle user key setup
        socket.on('set_public_key', async (publicKey) => {
            try {
                await prisma.user.update({
                    where: { id: dbUser.id },
                    data: { publicKey }
                });
                socket.emit('key_set_success');
                console.log(`🔑 Public key set for user ${user.name}`);
            }
            catch (error) {
                console.error('Error setting public key:', error);
                socket.emit('error', { message: 'Failed to set public key' });
            }
        });
        // Handle disconnect
        socket.on('disconnect', () => {
            console.log(`🔌 User ${user.name} disconnected (${socket.id})`);
        });
    });
};
exports.setupSocketHandlers = setupSocketHandlers;
//# sourceMappingURL=handlers.js.map