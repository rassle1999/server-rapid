import { client } from "../basic/database/mongoClient";
export const verify_swap = async (lg: any, swap_info: any) => {
  const data = await client.db('database1').collection('tokens_real').findOne({ address: { $regex: `^${swap_info.token}$`, $options: "i" } });
  return data != null;
}