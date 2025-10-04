import { openConnection, closeConnection } from "./src/database/db.js";
import { User } from "./src/classes/User.js";
import { Connection } from "./src/classes/Connection.js";
import { Message } from "./src/classes/Message.js";
import { Logger } from "./src/classes/Logger.js";

// Start Database Connection
openConnection();

let user = new User("Teste3", "teste");
let user2 = new User("Teste2", "teste");

//This method adds the user to the database
await user.createAccount();
await user2.createAccount();

//This method validate whether the builded object has the same name/password stored in the database
//If so it returns the _id (used as a session)
let idUser = await user.login();

//This will create the connection if it doesn't exist
await Connection.createNewConnection(idUser, "Teste2")

await Message.sendNewMessage(idUser, "Teste2", "Mensagem que será marcada para deleção");
await Message.sendNewMessage(idUser, "Teste2", "Mensagem que será realmente deletada");
await Message.sendNewMessage(idUser, "Teste2", "Mensagem que será editada");

//This method will return only the messages which the user hasn't marked as deleted
//The message is still in the database but won't be returned to the user 
let messageList = await Message.returnMessageList(idUser)

console.log(messageList)


//I'm using fixed indexes (you SHOULD NOT do that)
//This WILL MESS UP the order if the DB is not clean 
let edited_message = messageList[0];
if(messageList.length !== 0){
    //This method will set the message flag as deleted by the respective user inside the database
    //This WILL NOT REMOVE THE message from the database
    await messageList[2].markMessageAsDeleted(idUser);

    //This method will delete the message from the database
    //This method SHOULD NEVER BE USED
    //It only exists to meet the teacher's criteria
    await messageList[1].deleteMessage(messageList[1].id)

    //This method will update the message in the database
    await messageList[0].updateMessage("Mensagem editada com sucesso") 
}

messageList = await Message.returnMessageList(idUser)
await edited_message.deleteMessage(edited_message.id)
console.log("\n\n Após deleção \n\n")
console.log(messageList)


//Block the connection (disallow message sending from one user to another)
//Both users can block the connection if any of them blocked it the message won't be send.

await Connection.blockConnection(idUser, "Teste2");
await Message.sendNewMessage(idUser, "Teste2", "Essa mensagem não será enviada (conexão bloqueada)");

//Unblock the connection (allow message sending from one user to another)
//Both users must have unblocked it.
await Connection.unblockConnection(idUser, "Teste2")
await Message.sendNewMessage(idUser, "Teste2", "Essa mensagem será enviada (conexão desbloqueada)")

messageList = await Message.returnMessageList(idUser)

console.log("\n\n Mensagens após o bloqueio/desbloqueio: \n\n", messageList)

//delete a user, their connections and messages (recieve/sent).
User.deleteUser(idUser)

// Call closeConnection() for Crtl+C
process.on('SIGINT', closeConnection);
process.on('SIGTERM', closeConnection);