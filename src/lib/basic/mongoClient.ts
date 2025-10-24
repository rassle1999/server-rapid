
import { MongoClient, ServerApiVersion } from 'mongodb';
const uri = "mongodb+srv://rassle1999_db_user:C23VOdcE66ZDcmAM@cluster0.zab4wrh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
export const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

export async function run() {
  try {
    await client.connect();
    client.db("database1").collection("data").insertOne({name: "test", value: 123});
    console.log("Connected successfully to server");
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    await client.close();
  }
}

