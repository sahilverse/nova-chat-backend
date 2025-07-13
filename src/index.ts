import express from 'express';

import prisma from './config/prisma';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { PORT } from './constants';
import userRouter from './routes/user.route';
import cors from 'cors';

dotenv.config();

const app = express();


// Middleware
app.use(cors({
    origin: ['*'],
    credentials: true,
}));

app.use(express.json());
app.use(cookieParser());


// database connection
prisma.$connect()
    .then(() => {
        console.log('Connected to the database successfully');
    })
    .catch((error) => {
        console.error('Error connecting to the database:', error);

    });



// Routes 
app.use('/api/user', userRouter);





// Server
app.listen(PORT, () => {
    console.log(`Server is running on port:- http://localhost:${PORT}`);
});

