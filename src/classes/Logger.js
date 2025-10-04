import fs from 'fs';

export class Logger{

    static async logError(error){
        let data =  new Date();

        fs.appendFile('log.txt', `${data} --- ${error.message}\n` ,  (err) => {
            if(err) console.log("Erro ao criar o arquivo");
        })
    }
}