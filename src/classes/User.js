import crypto from 'crypto';
import { client } from '../database/db.js';
import { ObjectId } from 'mongodb';
import { Logger } from './Logger.js';
import { Connection } from './Connection.js';
import { Message } from './Message.js';

export class User {
  constructor(username, password) {
    this.username = username;
    this.password = this.hashPassword(password);
  }

  hashPassword(password) {
    if (typeof password !== 'string') throw new Error("Valid password is required");

    //Hash the password
    return crypto.createHash('sha256').update(password.trim()).digest('hex');
  }

  async createAccount() {
    try{
      //Validate wheter username already exists in db
      let usernameAlreadyExists = await client.db().collection('user').find({
        username: this.username
      }).toArray();
    
      if (usernameAlreadyExists.length) throw new Error("Username already exists");

      //Insert new Account into database
      await client.db().collection('user').insertOne({
        username: this.username,
        password: this.password,
      });
    }catch(e){
      Logger.logError(e);
    }
  }

  static async deleteUser(_id){
    await client.db().collection('user').deleteOne({
      _id
    }).toArray();
  }

  async login() {
    try{
      //Query for the username and password
      let result = await client.db().collection('user').findOne({
        username: this.username,
        password: this.password,
      });

      //Throw error if query does not return the document
      if (!result) throw new Error("Username or password incorrect");
      
      return result._id.toHexString();
    }catch(e){
      Logger.logError(e);
    }
  } 

  static async convertIdToUsername(_id){
      //convert string _id to objectID
      let objectID = new ObjectId(_id);

      //query for the user by ID
      let result = await client.db().collection('user').findOne({
        _id: objectID
      });

      if(result) return result.username;

      return null;
  
    }

  static async deleteUser(_id){
    await Connection.deleteAllConnections(_id);
    await client.db().collection('user').deleteOne({
      _id: new ObjectId(_id)
    })

    let list = Message.returnMessageList(_id)

    if(!list){
      list.forEach(element => {
        if(element instanceof Message){
          element.deleteMessage();
        }
      });
    }
  }

  static async userExists(username){
      //search in the db wheter user exists or not
      let result = await client.db().collection('user').findOne({
        username
      });

      if(!result) return false;
      return true;
  }
}