import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import ApiRoutes from './routes/apiRoutes';
import path from 'path';

const app = express();

const allowedOrigins = ['http://localhost:3000','http://192.168.1.107:3000', 'http://192.168.1.107:5000']; 

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());
app.use('/storage', express.static(path.join(process.cwd(), "storage")));
app.use('/api', ApiRoutes);

export default app;
