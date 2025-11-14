import express from 'express';
import { User } from '../classes/User.js'; 
import { Message } from '../classes/Message.js';
import { Connection } from '../classes/Connection.js';

const router = express.Router();
router.get('/', async (req, res) => {
    let userID = req.cookies.userID;
    if(!userID){
        res.redirect('/login');
    }
    let username = await User.convertIdToUsername(userID);
    if(!username){
        res.clearCookie('userID');
        res.redirect('/login');
    }

    const errorMessage = req.cookies.Error;
    if (errorMessage) {
        res.clearCookie('Error');
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
    });

    res.render('home', {
        posts, 
        contatos: contatosModificado, 
        my_username: username,
        error: errorMessage 
    });
});

router.post('/send-messsage', async(req, res) =>{
    const reciever = req.body.contact;
    const message = req.body.message;
    const id = req.cookies.userID;
    
    if(message){
        await Message.sendNewMessage(id, reciever, message);
        res.clearCookie('Error');
    } else {
        res.cookie('Error', 'A mensagem não pode estar vazia.', { maxAge: 5000, httpOnly: true });
    }

    res.redirect('/');
});

router.post('/delete', async (req, res) => {
    Message.markMessageAsDeleted(req.cookies.userID, req.body.message_id);
});

export default router;