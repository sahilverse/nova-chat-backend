import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes';



const app: express.Application = express();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL || "*",
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api', routes);

export default app;
