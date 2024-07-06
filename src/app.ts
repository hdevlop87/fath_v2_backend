import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import ApiRoutes from './routes/apiRoutes';
import path from 'path';

const app = express();

app.use(cors({
    origin: 'http://localhost:3000', 
    credentials: true, 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'))
app.use(cookieParser());
app.use('/storage', express.static(path.join(process.cwd(), "storage")));
app.use('/api', ApiRoutes);


export default app;

