import { ObjectId } from "mongodb";
import { Connection } from "./Connection.js";
import { User } from "./User.js";
import { client } from "../database/db.js";
import { Logger } from "./Logger.js";

export class Message{

    constructor(_id, username1, username2, send_by, deleted_by_username1, deleted_by_username2, payload, created_at){
        this.id = _id;
        this.send_by = send_by;
        this.username1 = username1;
        this.username2 = username2;
        this.deleted_by_username1 = deleted_by_username1;
        this.deleted_by_username2 = deleted_by_username2;
        this.payload = payload;
        this.created_at = created_at;
    }

    static async markMessageAsDeleted(id_deleter, _id){
        let username_deleter = await User.convertIdToUsername(id_deleter);

        let message = await client.db().collection('message').findOne({
            _id: new ObjectId(_id)
        });

        // check who is deleting (username 1 or username 2)
        if(message.username1 === username_deleter){
            //update the field "deleted_by_username1" with TRUE
            await client.db().collection('message').updateOne(
                {
                    _id: new ObjectId(_id)
                },{
                    $set: {deleted_by_username1: true}
                }
            )
        }

        if(message.username2 === username_deleter){
            //update the field "deleted_by_username2" with TRUE
            await client.db().collection('message').updateOne(
                {
                    _id: new ObjectId(_id)
                },{
                    $set: {deleted_by_username2: true}
                }
            )
        }
    }
    
    static async sendNewMessage(id_sender, username_reciever, payload){
        try{            
            //Must you factory because constructors can't use async/await.
            let username_sender = await User.convertIdToUsername(id_sender);
            let created_at = new Date().toISOString();
            //Return the connectionObject stored in the db.
            let connectionObject = await Connection.connectionAlreadyExists(username_sender, username_reciever);
            if(connectionObject.status !== 0) throw new Error("Some user in this connection is blocked");

            let send_by = await this.resolveSendBy(username_sender, connectionObject);
            let username1 = connectionObject.username1;
            let username2 = connectionObject.username2;

            //save to database
            return await this.saveMessageToDB(username1, username2, send_by, payload, created_at);
        }catch(e){
            Logger.logError(e)
        }   
    }

    static async resolveSendBy(username_sender, connectionObject){
        //Search for the connection and identify if
        //Username_sender is equal to the connection username1 or username2
        if(!connectionObject){
            throw new Error("Users aren't connected");
        }
        
        //No connection found
        //identify who send the message
        if(username_sender === connectionObject.username1){
            return 1; //message sent by username1
        }
        return 2; //message sent by username2
    }

    async deleteMessage(_id){
        await client.db().collection('message').deleteOne({
            _id
        })
    }

    async updateMessage(messageText){
        await client.db().collection('message').updateOne({
            _id: this.id  
        },{
            $set: {payload: messageText}
        })
    }

    static async saveMessageToDB(username1, username2, send_by, payload, created_at){
        //save to Database
        let result = await client.db().collection('message').insertOne({
                username1,
                username2,
                send_by,
                deleted_by_username1: false,
                deleted_by_username2: false,
                payload,
                created_at
        });
        let _id = new ObjectId(result.id);

        //return the Message object
        return new Message(_id, username1, username2, send_by, false, false, payload, created_at)
    }

    static async returnMessageList(id_resquester){
        try{
            let username_requester = await User.convertIdToUsername(id_resquester);
            if(!username_requester) throw new Error('username_requester not found');

        //query list of messages from db as a JSON array
        let listOfMessages = await client.db().collection('message').find({
            $or: [{
                username1: username_requester,
                deleted_by_username1: false
            },{
                username2: username_requester,
                deleted_by_username2: false
            }]
        }).sort({created_at: -1}).toArray();

        //convert each JSON array to array of Messages
        let listOfMessageObjects = listOfMessages.map(msg => new Message(
            msg._id,
            msg.username1,
            msg.username2,
            msg.send_by,
            msg.deleted_by_username1,
            msg.deleted_by_username2,
            msg.payload,
            msg.created_at,
        ));

        return listOfMessageObjects;
        }catch(e){
            Logger.logError(e);
        }
    }
}