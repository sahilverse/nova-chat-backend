import { Socket } from 'socket.io';

export type SocketStatus = 'success' | 'error';

export interface SocketResponse<T = any> {
    isSuccess: boolean;
    status: SocketStatus;
    message: string;
    data?: T;
    code?: number;
}

export default class SocketResponseHandler {
    static sendSuccess<T>(
        socket: Socket,
        event: string,
        message: string,
        data?: T,
        code?: number
    ) {
        const response: SocketResponse<T> = {
            isSuccess: true,
            status: 'success',
            message,
            data,
            code,
        };

        socket.emit(event, response);
    }

    static sendError(
        socket: Socket,
        event: string,
        message: string,
        code?: number
    ) {
        const response: SocketResponse<null> = {
            isSuccess: false,
            status: 'error',
            message,
            code,
        };

        socket.emit(event, response);
    }
}
