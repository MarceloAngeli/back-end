import express from 'express';
import { User } from '../classes/User.js';

const router = express.Router();

router.get('/login', async (req,res) =>{
    let userID = req.cookies.userID;
    if(userID){
        return res.redirect('/');
    }
    const errorMessage = req.cookies.Error;
    if (errorMessage) {
        res.clearCookie('Error');
    }
    res.render('login', { error: errorMessage });
});

router.post('/login', async (req, res) =>{
    const data = req.body;
    const username = data.username;
    const password = data.password;

    if (!username || !password) {
        res.cookie('Error', 'Usuário e senha são obrigatórios.', { maxAge: 5000, httpOnly: true });
        return res.redirect('/login');
    }

    const loginUser = new User(username, password);
    const idUser = await loginUser.login();
    
    if(idUser){
        res.clearCookie('Error'); 
        res.cookie('userID', idUser, { maxAge: 6 * 24 * 60 * 60 * 1000, httpOnly: true });
        res.redirect('/');
    }else{
        res.cookie('Error', 'Usuário ou senha inválidos.', { maxAge: 5000, httpOnly: true });
        res.redirect('/login');
    }
});

router.get('/signup', async (req, res) =>{
    const errorMessage = req.cookies.Error;
    if (errorMessage) {
        res.clearCookie('Error');
    }
    res.render('signup', { error: errorMessage });
});

router.post('/signup', async (req, res) =>{
    const data = req.body;
    const username = data.username;
    const password = data.password;

    if (!username || !password) {
        res.cookie('Error', 'Usuário e senha são obrigatórios.', { maxAge: 5000, httpOnly: true });
        return res.redirect('/signup');
    }

    const loginUser = new User(username, password);
    if(!await loginUser.createAccount()){
        res.cookie('Error', 'Erro ao criar conta (usuário já existe).', { maxAge: 5000, httpOnly: true });
        res.redirect('/signup');
        return;
    }
    
    let idUser = await loginUser.login();

    if(idUser){
        res.clearCookie('Error');
        res.cookie('userID', idUser, { maxAge: 6 * 24 * 60 * 60 * 1000, httpOnly: true });
    }
    res.redirect('/');
});

export default router;