import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRouter from './routes/user.route';



const app = express();

// Middleware
app.use(cors({
    origin: ['*'],
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/user', userRouter);

export default app;
