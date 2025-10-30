import { keccak256, solidityPack } from "ethers/lib/utils"
import { FACTORY_ADDRESS } from "../basic/constant/constant";
import { token_bytecode } from "../basic/constant/bytecode"
import { reg_address } from "../basic/reg_address";
import { ethers } from "ethers";
import { client } from "../basic/database/mongoClient";
import { provider } from "../basic/constant/constant";
async function getCreationBytecode() {
  const txHash = "0x85e0ea5b3c6d2ed07c91a3c56811aac946c095ea8964f42e82f3a6dc5e058d50";
  const tx = await provider.getTransaction(txHash);
  if (tx) {
    console.log(tx.to);    
    console.log('Creation Bytecode (Input Data):', tx.data.slice(0, 30));
  } else {
    console.error('Transaction not found');
  }
  return tx.data;
}
export const verify_token = async (lg: any, token_info: any) => {
  const from = reg_address(lg.from);
  const timestamp = reg_address(lg.date);
  console.log("from:", from);
  console.log("timestamp:", timestamp);
  const salt = keccak256(solidityPack(["address", "uint256"], [from, timestamp]));
  const bytecode = await getCreationBytecode();
  const codeHash = keccak256(bytecode);
  console.log("bytecode:", bytecode.slice(0, 20));
  console.log("codehash:", codeHash);
  const calcAddress = ethers.utils.getCreate2Address(FACTORY_ADDRESS, salt, codeHash);
  console.log("token-address:", token_info.address);
  console.log("calc-address:", calcAddress);
  return calcAddress.toLowerCase() == token_info.address.toLowerCase();
}
export const verify_swap = async (lg: any, swap_info: any) => {
  const data = await client.db('database1').collection('tokens_real').findOne({ address: { $regex: `^${swap_info.token}$`, $options: "i" } });
  return data != null;
}