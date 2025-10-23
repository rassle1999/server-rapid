
import { MongoClient, ServerApiVersion } from 'mongodb';
const uri = "mongodb+srv://rassle1999_db_user:C23VOdcE66ZDcmAM@cluster0.zab4wrh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
export const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

export async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    client.db("database1").collection("data").insertOne({name: "test", value: 123});
    console.log("Connected successfully to server");
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    await client.close();
  }
}

