import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import ApiRoutes from './routes/apiRoutes';

const app = express();

app.use(cors({
    origin: 'http://localhost:3000', 
    credentials: true, 
}));

app.use(express.static('public'))
app.use(express.json());
app.use(cookieParser());

app.use('/api', ApiRoutes);


export default app;

