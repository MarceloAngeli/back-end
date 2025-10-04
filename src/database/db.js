import { MongoClient } from "mongodb";

export const client = new MongoClient('mongodb://localhost:27017/WhatsAppClone');

// Create database connection
export async function openConnection() {
  try {
    await client.connect();
    await client.db().command({ ping: 1 });
    console.log("Database connection established.");
  } catch (e) {
    console.log(e);
  }
}

//Handle connection closing
export async function closeConnection() {
  console.log("Destroying connection");
  try {
    await client.close();
    process.exit(0);
  } catch (e) {
    console.log("Error while destroying connection");
    process.exit(1);
  }
}