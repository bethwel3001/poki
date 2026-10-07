import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const globalForMongo = globalThis as typeof globalThis & {
  mongoClientPromise?: Promise<MongoClient>;
};

export function getMongoClient() {
  if (!uri) {
    throw new Error("MONGODB_URI is not set.");
  }

  if (!globalForMongo.mongoClientPromise) {
    const client = new MongoClient(uri);
    globalForMongo.mongoClientPromise = client.connect();
  }

  return globalForMongo.mongoClientPromise;
}

export async function getMongoDb(): Promise<Db> {
  const client = await getMongoClient();

  return client.db();
}
