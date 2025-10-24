import { ethers } from "ethers";
import { FACTORY_ADDRESS,FACTORY_ABI,BONDING_ABI,provider } from "../basic/constant";
export const getBondingCurveInfo = async (address: string) => {
    const contract = new ethers.Contract(FACTORY_ADDRESS, FACTORY_ABI, provider);
    const bondingCurveAddress = await contract.bondingCurveMap(address);
    const bondingCurveContract = new ethers.Contract(bondingCurveAddress,BONDING_ABI,provider );
    const reserveToken = await bondingCurveContract.reserveToken();
    const reserveEth = await bondingCurveContract.reserveEth();
    const tokenReserveCap = await bondingCurveContract.tokenReserveCap();
    return {reserveToken:reserveToken.toString(),reserveEth:reserveEth.toString(),tokenReserveCap:tokenReserveCap.toString(),ETHRESERVECAP:5_000_000_000_000_000_000};
}
