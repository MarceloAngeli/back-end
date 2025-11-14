import { client } from "../database/db.js";
import { User } from "./User.js";
const status = Object.freeze({
    NORMAL: 0,
    BLOCKED_BY_ONE: 1,
    BLOCKED_BY_TWO: 2,
    BLOCKED_BY_BOTH: 3,
});

export class Connection {
    
    static async createNewConnection(id_username1, username2) {
            //get the username from its id
            let username1 = await User.convertIdToUsername(id_username1);
            if(!username1) throw new Error("Invalid username_id");

            if(!username2) throw new Error("The user you are searching for does not exist");

            //verify if destiny user exists
            let user2exists = await User.userExists(username2);
            console.log(user2exists)
            if(!user2exists) throw new Error("Usuário encontrado")

            //verify if connection already exists
            if (await this.connectionAlreadyExists(username1, username2)){
                throw new Error("Conexão já existe");
            }

            //create the connection
            await client.db().collection('connection').insertOne({
                username1,
                username2,
                status: 0
            });
            
    }

    static async unblockConnection(id_unblocker, unblocker_target){
        let username_unblocker = await User.convertIdToUsername(id_unblocker);

        let result = await client.db().collection('connection').findOne(
            {$or: [{
                username1: username_unblocker,
                username2: unblocker_target
            },{
                username1: unblocker_target,
                username2: username_unblocker
            }
            ]}   
        )
        if(!result) throw new Error("Connection can't be unblocked since it does not exist in database")
        
        let oldStatus = result.status;
        let newStatus = oldStatus;
    
        if(result.username1 === username_unblocker){
            if(oldStatus === status.BLOCKED_BY_ONE){
                newStatus = status.NORMAL;
            } 
    
            if(oldStatus === status.BLOCKED_BY_BOTH){
                newStatus = status.BLOCKED_BY_TWO;
            } 
        } 
    
        if(result.username2 === username_unblocker){
            if(oldStatus === status.BLOCKED_BY_TWO){
                newStatus = status.NORMAL;
            } 
            if(oldStatus === status.BLOCKED_BY_BOTH){
                newStatus = status.BLOCKED_BY_ONE;
            }         
        }

        await client.db().collection('connection').updateOne(
            {
                _id: result._id
            },{
                $set: {status: newStatus}
            }
        )
    }

    static async blockConnection(id_blocker, blocker_target){
        let username_blocker = await User.convertIdToUsername(id_blocker);
        //search for the connection in the db
        let result = await client.db().collection('connection').findOne(
            {$or: [{
                username1: username_blocker,
                username2: blocker_target
            },{
                username1: blocker_target,
                username2: username_blocker,
            }
            ]}
        )

        if(!result) throw new Error("Connection can't be blocked since it does not exist in database")

        //change status to follow "enum" in the beggining of the file
        let oldStatus = result.status;
        let newStatus = oldStatus;

        if(result.username1 === username_blocker){
            if(oldStatus === status.NORMAL){
                newStatus = status.BLOCKED_BY_ONE;
            } 

            if(oldStatus === status.BLOCKED_BY_TWO){
                newStatus = status.BLOCKED_BY_BOTH;
            } 
        } 

        if(result.username2 === username_blocker){
            if(oldStatus === status.NORMAL){
                newStatus = status.BLOCKED_BY_TWO;
            } 

            if(oldStatus === status.BLOCKED_BY_ONE){
                newStatus = status.BLOCKED_BY_BOTH;
            }         
        }

        await client.db().collection('connection').updateOne(
            {
                _id: result._id
            },{
                $set: {status: newStatus}
            }
        )
    }
    
    static async connectionAlreadyExists(username1, username2) {
        //search if connection already exists
        let result = await client.db().collection('connection').findOne({ $or: [{
            username1,
            username2
        },
        {
            username1: username2,
            username2: username1
        }]});
        //return an object if connection exists and null otherwise
        return result;
    }

    static async deleteAllConnections(_id){

        let username = await User.convertIdToUsername(_id);
        await client.db().collection('connection').deleteOne({
            $or: [{
                username1: username
            }, {
                username2: username
                }
            ]
        })
    }

    static async deleteConnection(_id, username_target){
        
        await client.db().collection('connection').deleteOne({
            $or: [{
                username1: User.convertIdToUsername(_id),
                username2: username_target
                }, {
                username1: username_target,
                username2: User.convertIdToUsername(_id)
                }
            ]
        })

        
    }

    static async blockOrUnblock(username_blocker, username_target){

        let result = await client.db().collection('connection').findOne(
            {$or: [{
                username1: username_blocker,
                username2: username_target
            },{
                username1: username_target,
                username2: username_blocker
            }
            ]}   
        )
        
        if(result.status == 0){
            return 'block';
        }

        if(username_blocker == result.username1 && result.status == 1){
            return 'unblock';
        }

        if(username_blocker == result.username2 && result.status == 1){
            return 'block';
        }

        if(username_blocker == result.username1 && result.status == 2){
            return 'block';
        }

        if(username_blocker == result.username2 && result.status == 2){
            return 'unblock';
        }

        return 'unblock';
    }

    static async listUserConnections(_id){
        let username = await User.convertIdToUsername(_id);
        let result = await client.db().collection('connection').find(
            {$or: [{
                username1: username,
            },{
                username2: username,
            }
            ]}   
        ).toArray();
        return result;
    }
}