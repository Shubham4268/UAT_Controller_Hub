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

            socket.on('join-activity', (activityId) => {
                socket.join(`activity-${activityId}`);
                console.log(`Socket joined room: activity-${activityId}`);
            });

            socket.on('issue:submitted', (data) => {
                const roomId = data.sessionId || data.activityId;
                socket.to(`activity-${roomId}`).emit('issue:new', data);
            });

            socket.on('issue:validated', (data) => {
                socket.to(`activity-${data.sessionId || data.activityId}`).emit('issue:refreshed', data);
            });

            socket.on('new-session', (data) => {
                // Broadcast session creation to all leads/admins
                socket.broadcast.emit('session-created', data);
            });
        });

        res.socket.server.io = io;
    }
    res.end();
};

export default ioHandler;
