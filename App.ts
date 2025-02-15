import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors'
import cookieParser from "cookie-parser";
import router from "./router/index";
import errorMiddleware from "./middleware/error-middleware"
import multer from "multer";

const app = express();

const storage = multer.memoryStorage(); // Если загружаете в Supabase, используйте memoryStorage
const upload = multer({ storage });
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
];

app.use(cors({
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
}));

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.json());
app.use('/api', router);

// @ts-ignore
app.use(errorMiddleware);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});