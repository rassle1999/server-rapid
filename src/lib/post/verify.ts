import { keccak256, solidityPack } from "ethers/lib/utils"
import { FACTORY_ADDRESS } from "../basic/constant";
import { token_bytecode } from "../basic/constant"
import { reg_address } from "../basic/reg_address";
import { ethers } from "ethers";
import { client } from "../basic/mongoClient";
export const verify_token = (lg: any, token_info: any) => {
    const from = reg_address(lg.from);
    const timestamp = parseInt(lg.date);
    console.log("from:", from, "date:", timestamp);
    const salt = keccak256(solidityPack(["address", "uint256"], [from, timestamp]));
    console.log("salt:",salt);
    const bytecode = token_bytecode;
    console.log("bytecode:",bytecode.slice(-30));
    const codeHash = keccak256(bytecode);
    const calcAddress = ethers.utils.getCreate2Address(FACTORY_ADDRESS,salt,codeHash);
    console.log("Calculated:", calcAddress);
    console.log("Token address:",token_info.address);
    return calcAddress.toLowerCase() == token_info.address.toLowerCase();
}
export const verify_swap = async (lg: any,swap_info:any) =>{
    const data =await client.db('database1').collection('tokens_real').findOne({address:swap_info.token});
    return data!=null;
}