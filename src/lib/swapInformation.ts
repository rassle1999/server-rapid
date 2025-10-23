import { SWAP_ABI, provider } from "./constant";
import { ethers } from "ethers";
export const getSwapInformation = async (data: string) => {
    const iface = new ethers.utils.Interface(SWAP_ABI);
    const decoded = await iface.decodeEventLog("Swap", data);
    return { token: decoded.token, amountIn: decoded.amountIn.toString(), amountOut: decoded.amountOut.toString(), price: decoded.price.toString(), direction: decoded.direction };
}