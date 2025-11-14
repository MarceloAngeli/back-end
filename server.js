import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { openConnection } from "./src/database/db.js";
import cookieParser from 'cookie-parser';
import authRoutes from './src/routes/authRoutes.js';
import messageRoutes from './src/routes/messageRoutes.js';
import connectionRoutes from './src/routes/connectionRoutes.js';

openConnection();
let app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'src/view'));

//Middleware
app.use(express.static(path.join(__dirname, 'src/public')));
app.use(express.urlencoded({extended:false}));
app.use(cookieParser());
app.use(express.json());

//Routes
app.use(authRoutes); 
app.use(messageRoutes); 
app.use(connectionRoutes);

//Server
app.listen(3001);