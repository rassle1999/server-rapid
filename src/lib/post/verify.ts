import { keccak256, solidityPack } from "ethers/lib/utils"
import { FACTORY_ADDRESS } from "../basic/constant";
import { token_bytecode } from "../basic/constant"
import { reg_address } from "../basic/reg_address";
import { ethers } from "ethers";
import { provider } from "../basic/constant";
export const verify_token = async (lg: any, token_info: any) => {
    const from = FACTORY_ADDRESS;
    const timestamp = parseInt(lg.date);
    console.log("from:", from, "date:", timestamp);
    const salt = keccak256(solidityPack(["address", "uint256"], [from, timestamp]));
    console.log("salt:",salt);
    const bytecode = token_bytecode;
    console.log("bytecode:",bytecode.slice(0,30));
    const codeHash = keccak256(bytecode);
    const calcAddress = ethers.utils.getCreate2Address(from,salt,codeHash);
    console.log("Calculated:", calcAddress);
    console.log("Token address:",token_info.address);
}