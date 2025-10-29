
import { MongoClient, ServerApiVersion } from 'mongodb';
const uri = "mongodb+srv://rassle1999_db_user:C23VOdcE66ZDcmAM@cluster0.zab4wrh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
export const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});