import { client } from "./mongoClient"
import { getBondingCurveInfo } from "./bondingCurveInfo";
export const getTokenData =async () =>{
    const tokenData = await client.db("database1").collection("tokens_real").find({}).toArray();    
    return tokenData;
}