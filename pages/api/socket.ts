import { Server as NetServer } from 'http';
import { NextApiRequest } from 'next';
import { Server as ServerIO } from 'socket.io';
import { NextApiResponseServerIO } from '@/types/socket';

export const config = {
    api: {
        bodyParser: false,
    },
};

const ioHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
    if (!res.socket.server.io) {
        console.log('*First use, starting socket.io');

        const httpServer: NetServer = res.socket.server as any;
        const io = new ServerIO(httpServer, {
            path: '/api/socket',
            addTrailingSlash: false,
        });

        io.on('connection', (socket) => {
            console.log('New client connected');

            socket.on('join:session', (sessionId) => {
                socket.join(sessionId);
                console.log(`Socket joined session room: ${sessionId}`);
            });

            socket.on('issue:submitted', (data) => {
                const roomId = data.sessionId;
                if (roomId) {
                    // Emit issue:created to everyone in the room (including sender if desired, 
                    // but usually sender updates local state immediately, so .to().emit() is common)
                    io.to(roomId).emit('issue:created', data);
                }
            });

            socket.on('issue:validated', (data) => {
                const roomId = data.sessionId;
                if (roomId) {
                    io.to(roomId).emit('issue:refreshed', data);
                }
            });

            socket.on('new-session', (data) => {
                socket.broadcast.emit('session-created', data);
            });

            socket.on('session:updated', (data) => {
                const roomId = data._id;
                if (roomId) {
                    io.to(roomId).emit('session:data-updated', data);
                }
            });
        });

        res.socket.server.io = io;
    }
    res.end();
};

export default ioHandler;
