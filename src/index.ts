import './loadEnv';
import app from './app';
import prisma from './config/prisma';
import { PORT } from './constants';




// Database connection
prisma.$connect()
    .then(() => {
        console.log('Connected to the database successfully');

        app.listen(PORT, () => {
            console.log(`Server is running at http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Error connecting to the database:', error);
        process.exit(1);
    });
