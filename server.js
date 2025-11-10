import http from 'http';
import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { openConnection, closeConnection } from "./src/database/db.js";
import { User } from './src/classes/User.js';
import { Message } from './src/classes/Message.js';
import cookieParser from 'cookie-parser';
import { Connection } from './src/classes/Connection.js';
import { ObjectId } from 'mongodb';

openConnection();
let app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.set('view engine', 'hbs')
app.set('views', path.join(__dirname, 'src/view'))
app.use(express.static(path.join(__dirname, 'src/public')))
app.use(express.urlencoded({extended:false}))
app.use(cookieParser());
app.use(express.json());

let user = new User("Teste3", "teste");
let idUser = await user.login();
await Message.sendNewMessage(idUser, "Teste2", "Mensagem que será marcada para deleção");

app.listen(3001)

app.get('/', async (req, res) => {

    let userID = req.cookies.userID;
    if(!userID){
        res.redirect('/login');
    }
    let username = await User.convertIdToUsername(userID);
    if(!username){
        res.clearCookie('userID')
        res.redirect('/login');
    }
    let posts = await Message.returnMessageList(userID);

    let contatos = await Connection.listUserConnections(userID);
    let contatosModificado = [];

    let contatoUsername;
    contatos.forEach(contato => {
        if(contato.username1 === username){
            contatoUsername = contato.username2;
        }else contatoUsername = contato.username1;

        contatosModificado.push({
            contato: contatoUsername,
            status: contato.status,
        })
    })

    res.render('home', {posts, contatos: contatosModificado, my_username:username});
})

app.post('/new-connection', async(req, res) =>{
    const username = req.body.username;
    await Connection.createNewConnection(req.cookies.userID, username);
    res.redirect('/');
})

app.get('/login', async (req,res) =>{
    let userID = req.cookies.userID;
    if(userID){
        res.redirect('/');
    }
    else res.render('login');
})

app.post('/send-messsage', async(req, res) =>{

    const reciever = req.body.contact;
    const message = req.body.message;
    const id = req.cookies.userID;
    
    if(message){
        await Message.sendNewMessage(id, reciever, message);
    }

    res.redirect('/');
})

app.post('/login', async (req, res) =>{
    const data = req.body;
    const username = data.username;
    const password = data.password;

    const loginUser = new User(username, password);
    const idUser = await loginUser.login();
    if(idUser){
        res.cookie('userID', idUser, { maxAge: 6 * 24 * 60 * 60 * 1000, httpOnly: true })
        res.redirect('/')
    }else{
        res.redirect('/login')
    }
})


app.get('/signup', async (req, res) =>{
    res.render('signup')
})

app.post('/signup', async (req, res) =>{
    const data = req.body;
    const username = data.username;
    const password = data.password;

    const loginUser = new User(username, password);
    await loginUser.createAccount();
    let idUser = await loginUser.login();

    if(idUser){
        res.cookie('userID', idUser, { maxAge: 6 * 24 * 60 * 60 * 1000, httpOnly: true })
        res.redirect('/')
    }else{
        res.redirect('login');
    }
})

app.post('/delete', async (req, res) => {
    Message.markMessageAsDeleted(req.cookies.userID, req.body.message_id);
});

app.post('/block', async (req, res) => {

    
    try{
        let username = await User.convertIdToUsername(req.cookies.userID);
        let blockOrUnblock = await Connection.blockOrUnblock(username,req.body.username_blocked);
        
        console.log(blockOrUnblock);
        if(blockOrUnblock === 'block'){
            await Connection.blockConnection(req.cookies.userID, req.body.username_blocked);
        }else{
            await Connection.unblockConnection(req.cookies.userID, req.body.username_blocked);
        }
    }catch(e){
        console.log(e)
    }
    res.redirect('/')
})