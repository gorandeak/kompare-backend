import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
const port = process.env.MONGODBPORT
  ? parseInt(process.env.MONGODBPORT, 10)
  : undefined;

let isDBConnected = false;
const mongod = new MongoMemoryServer({
  instance: {
    port: port,
  },
});

const connectDB = async () => {
  if (isDBConnected) return;

  try {
    if (!mongod.instanceInfo) {
      await mongod.start();
    }
    const uri = await mongod.getUri();
    console.log("Connection string for mongoDB " + uri);

    await mongoose.connect(uri);

    console.log("Successfully connected to in-memory MongoDB");
  } catch (error) {
    console.error("Error connecting to in-memory MongoDB:", error);
    process.exit(1);
  }
};

process.on("exit", async () => {
  await mongod.stop();
});

export default connectDB;
