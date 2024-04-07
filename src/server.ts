import 'module-alias/register';
import http from 'http';
import app from './app';
import dotenv from 'dotenv';

dotenv.config();
const PORT = process.env.PORT;
const server = http.createServer(app);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});