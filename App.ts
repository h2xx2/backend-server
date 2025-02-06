import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors'
import cookieParser from "cookie-parser";
import router from "./router/index";
import errorMiddleware from "./middleware/error-middleware"

const app = express();

const corsOptions = {
    origin: 'http://localhost:5173', // Разрешаем запросы с этого источника (из вашего фронтенда)
    methods: ['GET', 'POST'], // Разрешаем только определенные методы
    allowedHeaders: ['Content-Type'],
    credentials: true,
};

app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use('/api', router);

// @ts-ignore
app.use(errorMiddleware);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});