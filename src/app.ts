import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { setupSwagger } from './swagger';



const app: express.Application = express();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL as string,
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api', routes);


// Swagger UI
setupSwagger(app);

export default app;
