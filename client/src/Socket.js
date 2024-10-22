import {io} from 'socket.io-client';

export const initSocket = async () =>{
    const options = {
        'force new connection': true,
        reconnectionAttempts : 'Infinity',
        transports: ['websocket'],
    };
    return io("https://editor-backend-12.onrender.com", options);
}