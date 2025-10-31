import { ethers } from "ethers";
export const TOKEN_ABI = [
    "function uri() view returns (string)",
    "function totalSupply() view returns (uint256)",
    "function symbol() view returns (string)",
    "function name() view returns (string)"
];
export const SWAP_ABI = [
    `event Swap(
        address token,
    address indexed swapper,
    uint amountIn,
    uint amountOut,
    uint price,
    bool direction
    ) `,
];
export const FACTORY_ADDRESS = "0xBF4114D783d96D2205cF5BD71B3CfBFD53E8fF00";
export const FACTORY_ABI = [
    "function bondingCurveMap(address) view returns (address)",
];
export const BONDING_ABI = [
    "function reserveToken() view returns (uint256)",
    "function reserveEth() view returns (uint256)",
    "function tokenReserveCap() view returns (uint256)",
]
export const RPC_URL = "https://sparkling-billowing-breeze.base-mainnet.quiknode.pro/cac97de656091bc1033f00a4749869ed88b45610/";
export const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
export const BATCH_SIZE = 100;
export const PAGE_SIZE = 6;
export const FAKEINITIALLIQUIDITY = 1500_000_000_000_000_000;