import express from 'express';
import { User } from '../classes/User.js';
import { Connection } from '../classes/Connection.js'; 
import { Logger } from '../classes/Logger.js';

const router = express.Router();

router.post('/new-connection', async(req, res) =>{
    const username = req.body.username;
    if (!username) {
        res.cookie('Error', 'O nome do contato não pode estar vazio.', { maxAge: 5000, httpOnly: true });
        return res.redirect('/');
    }

    try{
        await Connection.createNewConnection(req.cookies.userID, username);
        res.clearCookie('Error');
    }catch(e){
        Logger.logError(e);
        res.cookie('Error', e.message || 'Erro ao adicionar contato (usuário pode não existir).', { maxAge: 5000, httpOnly: true });
    }
    res.redirect('/');
});

router.post('/block', async (req, res) => {
    let username = await User.convertIdToUsername(req.cookies.userID);
    let blockOrUnblock = await Connection.blockOrUnblock(username,req.body.username_blocked);
        
    console.log(blockOrUnblock);
    if(blockOrUnblock === 'block'){
        await Connection.blockConnection(req.cookies.userID, req.body.username_blocked);
    }else{
        await Connection.unblockConnection(req.cookies.userID, req.body.username_blocked);
    }
    res.redirect('/')
});

export default router;