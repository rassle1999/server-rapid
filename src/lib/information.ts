import { SWAP_ABI,TOKEN_ABI, provider } from "./constant";
import { ethers } from "ethers";
import { reg_address } from "./reg_address";
import axios from "axios";
export const getSwapInformation = async (data: string,date:string) => {
    const iface = new ethers.utils.Interface(SWAP_ABI);
    const decoded = await iface.decodeEventLog("Swap", data);
    return { token: decoded.token, amountIn: decoded.amountIn.toString(), amountOut: decoded.amountOut.toString(), price: decoded.price.toString(), direction: decoded.direction ,date:parseInt(date)};
}

export const getTokenInformation = async (add: string, date: string) => {
    const address = reg_address(add);
    const tokenContract = new ethers.Contract(address, TOKEN_ABI, provider);
    console.log("address:", address);
    console.log("date:", parseInt(date));
    const createdAt = parseInt(date);
    const uri = await tokenContract.uri();
    const totalSupply = (await tokenContract.totalSupply()).toString();
    const symbol = await tokenContract.symbol();
    const name = await tokenContract.name();
    const uriData = (await axios.get(uri)).data;
    console.log("URIDAT:",uriData);
    console.log("uri:", await tokenContract.uri());
    console.log("totalSupply:", (await tokenContract.totalSupply()).toString());
    console.log("symbol:", await tokenContract.symbol());
    console.log("name:", await tokenContract.name());
    return { address: address, createdAt: createdAt, uri: uri, uriData:uriData,totalSupply: totalSupply, symbol: symbol, name: name }
}
export const getStreamInformation = async ( log: any ) =>{
    if(log.type == 0)
    {
        return (await getTokenInformation(log.token, log.date));
    }
    else{
        return (await getSwapInformation(log.data, log.date));
    }
}