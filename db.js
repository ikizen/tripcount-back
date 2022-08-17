import { MongoClient } from "mongodb";

const url =
    "mongodb+srv://ikizen:7rhVIDTr94Zlw0xu@cluster0.a6zec.mongodb.net/test";

export async function connectToCluster() {
    let mongoClient;

    try {
        mongoClient = new MongoClient(url);
        console.log("Connecting to MongoDB Atlas cluster...");
        await mongoClient.connect();
        console.log("Successfully connected to MongoDB Atlas!");

        return mongoClient;
    } catch (error) {
        console.error("Connection to MongoDB Atlas failed!", error);
        process.exit();
    }
}
