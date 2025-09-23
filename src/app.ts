import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import routes from './routes';
import { setupSwagger } from './swagger';
import { globalLimiter } from './utils/limiter';
import helmet from 'helmet';
import compression from 'compression';
import { errorHandler } from './utils/ErrorHandler';


const app: express.Application = express();

// Middleware
app.use(cors({
    origin: process.env.CLIENT_URL as string,
    credentials: true,
}));
app.use(helmet());
app.use(compression());
app.use(express.json());
app.use(cookieParser());
app.use(globalLimiter);

// Error Handler
app.use(errorHandler);


// Routes
app.use('/api', routes);


// Swagger UI
setupSwagger(app);

export default app;
