import { client } from "../basic/database/mongoClient";
import { FAKEINITIALLIQUIDITY } from "../basic/constant/constant";
export const tokenDatabyDate = async (startIndex: number, count: number, search?: string) => {
    const searchText = search || "";
    const tokens = await client
        .db("database1")
        .collection("tokens_real")
        .aggregate([
            {
                $match: {
                    $or: [
                        { name: { $regex: searchText, $options: "i" } },
                        { symbol: { $regex: searchText, $options: "i" } }
                    ]
                }
            },
        ])
        .sort({ createdAt: -1 })
        .skip(startIndex)
        .limit(count)
        .toArray();
    const tokenAddresses = tokens.map(t => new RegExp(`^${t.address}$`, "i"));
    const now = Date.now() / 1000;
    const latestSwaps = await client.db("database1")
        .collection("swaps_real")
        .aggregate([
            { $match: { token: { $in: tokenAddresses } } },
            { $sort: { date: -1 } },
            { $group: { _id: "$token", swap: { $first: "$$ROOT" } } }
        ])
        .toArray();
    const swapsBefore = await client.db("database1")
        .collection("swaps_real")
        .aggregate([
            {
                $match: {
                    token: { $in: tokenAddresses },
                    date: { $lt: now - 24 * 60 * 60 }
                }
            },
            { $sort: { date: -1 } },
            { $group: { _id: "$token", swap: { $first: "$$ROOT" } } }
        ])
        .toArray();
    const latestMap = Object.fromEntries(
        latestSwaps.map(s => [s._id.toLowerCase(), s.swap])
    );
    const beforeMap = Object.fromEntries(
        swapsBefore.map(s => [s._id.toLowerCase(), s.swap])
    );
    const tokenData = tokens.map(token => {
        const addr = token.address.toLowerCase();
        const swap = latestMap[addr];
        const swapBefore = beforeMap[addr];
        const price = parseFloat(swap?.price || FAKEINITIALLIQUIDITY * 1e19 / token.totalSupply / 11);
        const oldPrice = parseFloat(swapBefore?.price || FAKEINITIALLIQUIDITY * 1e19 / token.totalSupply / 11);
        return {
            id: token.address,
            name: token.name,
            symbol: token.symbol,
            image: token.uriData?.image,
            price,
            priceChange: price - oldPrice,
            marketCap: (parseFloat(swap?.price || FAKEINITIALLIQUIDITY * 1e19 / token.totalSupply / 11) * parseFloat(token.totalSupply || 0)),
            createdAt: token.createdAt,
            address: token.address
        };
    });
    return tokenData;
}
export const tokenDatabyMarketCap = async (startIndex: number, count: number, search?: string) => {
    const now = Date.now() / 1000;
    const searchText = search || "";
    const tokens = await client
        .db("database1")
        .collection("tokens_real")
        .aggregate([
            {
                $match: {
                    $or: [
                        { name: { $regex: searchText, $options: "i" } },
                        { symbol: { $regex: searchText, $options: "i" } }
                    ]
                }
            },
            {
                $lookup: {
                    from: "swaps_real",
                    let: { addr: { $toLower: "$address" } },
                    pipeline: [
                        {
                            $match: { $expr: { $eq: [{ $toLower: "$token" }, "$$addr"] } }
                        },
                        { $sort: { "date": -1 } },
                        {
                            $group: {
                                _id: null,
                                latestSwap: { $first: "$$ROOT" },
                                swapBefore: {
                                    $first: {
                                        $cond: [
                                            { $lt: ["$date", now - 24 * 60 * 60] },
                                            "$$ROOT",
                                            "$$REMOVE"
                                        ]
                                    }
                                }
                            }
                        }
                    ],
                    as: "swaps"
                }
            },
            { $unwind: { path: "$swaps", preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    marketCap: {
                        $multiply: [
                            { $toDouble: "$swaps.latestSwap.price" },
                            { $toDouble: "$totalSupply" }
                        ]
                    },
                    price: { $toDouble: "$swaps.latestSwap.price" },
                    priceChange: {
                        $subtract: [
                            { $toDouble: "$swaps.latestSwap.price" },
                            { $toDouble: "$swaps.swapBefore.price" }
                        ]
                    }
                }
            },
            {
                $project: {
                    id: "$address",
                    address: "$address",
                    name: "$name",
                    symbol: "$symbol",
                    image: "$uriData.image",
                    price: {
                        $cond: {
                            if: { $not: [{ $isNumber: "$price" }] },
                            then: {
                                $divide: [
                                    FAKEINITIALLIQUIDITY * 1e19 / 11,
                                    { $toDouble: "$totalSupply" }
                                ]
                            },
                            else: "$price"
                        }
                    },
                    priceChange: {
                        $cond: {
                            if: { $not: [{ $isNumber: "$priceChange" }] },
                            then: 0,
                            else: "$priceChange"
                        }
                    },
                    totalSupply: "$totalSupply",
                    createdAt: "$createdAt",
                    marketCap: {
                        $cond: {
                            if: { $not: [{ $isNumber: "$marketCap" }] },
                            then: FAKEINITIALLIQUIDITY * 1e19 / 11,
                            else: "$marketCap"
                        }
                    },
                }
            },
            { $sort: { marketCap: -1 } },
            { $skip: startIndex },
            { $limit: count }
        ])
        .toArray();
    return tokens;
}
export const tokenDatabyVolume = async (startIndex: number, count: number, search?: string) => {
    const now = Date.now() / 1000;
    const searchText = search || "";
    const tokens = await client
        .db("database1")
        .collection("tokens_real")
        .aggregate([
            {
                $match: {
                    $or: [
                        { name: { $regex: searchText, $options: "i" } },
                        { symbol: { $regex: searchText, $options: "i" } }
                    ]
                }
            },
            {
                $lookup: {
                    from: "swaps_real",
                    let: { addr: { $toLower: "$address" } },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $eq: [
                                        { $toLower: "$token" },
                                        "$$addr"
                                    ]
                                }
                            }
                        },
                        { $sort: { "date": -1 } },
                        {
                            $addFields: {
                                volumeValue: {
                                    $cond: [
                                        { $eq: ["$direction", true] },
                                        { $toDouble: "$amountOut" },
                                        { $toDouble: "$amountIn" }
                                    ]
                                }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                latestSwap: { $first: "$$ROOT" },
                                swapBefore: {
                                    $first: {
                                        $cond: [
                                            { $lt: ["$date", now - 24 * 60 * 60] },
                                            "$$ROOT",
                                            "$$REMOVE"
                                        ]
                                    }
                                },
                                volume: { $sum: "$volumeValue" }
                            }
                        }
                    ],
                    as: "swaps"
                }
            },
            { $unwind: { path: "$swaps", preserveNullAndEmptyArrays: true } },
            {
                $addFields: {
                    marketCap: {
                        $multiply: [
                            { $toDouble: "$swaps.latestSwap.price" },
                            { $toDouble: "$totalSupply" }
                        ]
                    },
                    price: { $toDouble: "$swaps.latestSwap.price" },
                    priceChange: {
                        $subtract: [
                            { $toDouble: "$swaps.latestSwap.price" },
                            { $toDouble: "$swaps.swapBefore.price" }
                        ]
                    }
                }
            },
            {
                $project: {
                    id: "$address",
                    address: "$address",
                    name: "$name",
                    symbol: "$symbol",
                    image: "$uriData.image",
                    price: {
                        $cond: {
                            if: { $not: [{ $isNumber: "$price" }] },
                            then: {
                                $divide: [
                                    FAKEINITIALLIQUIDITY * 1e19 / 11,
                                    { $toDouble: "$totalSupply" }
                                ]
                            },
                            else: "$price"
                        }
                    },
                    priceChange: {
                        $cond: {
                            if: { $not: [{ $isNumber: "$priceChange" }] },
                            then: 0,
                            else: "$priceChange"
                        }
                    },
                    totalSupply: "$totalSupply",
                    createdAt: "$createdAt",
                    marketCap: {
                        $cond: {
                            if: { $not: [{ $isNumber: "$marketCap" }] },
                            then: FAKEINITIALLIQUIDITY * 1e19 / 11,
                            else: "$marketCap"
                        }
                    },
                    volume: "$swaps.volume"
                }
            },
            { $sort: { volume: -1 } },
            { $skip: startIndex },
            { $limit: count }
        ])
        .toArray();
    return tokens;
}
export const tokenDatabyAddress = async (address: string) => {
    const token = await client
        .db("database1")
        .collection("tokens_real")
        .findOne({ address: { $regex: `^${address}$`, $options: "i" } });
    const now = Date.now() / 1000;
    const latestSwap = await client.db("database1")
        .collection("swaps_real")
        .findOne({ token: { $regex: `^${address}$`, $options: "i" } }, { sort: { date: -1 } })
    const swapBefore = await client.db("database1")
        .collection("swaps_real")
        .findOne(
            { token: { $regex: `^${address}$`, $options: "i" }, date: { $lt: now - 24 * 60 * 60 } },
            { sort: { date: -1 } }
        );
    const price = parseFloat(latestSwap?.price || FAKEINITIALLIQUIDITY * 1e19 / token?.totalSupply / 11);
    const oldPrice = parseFloat(swapBefore?.price || FAKEINITIALLIQUIDITY * 1e19 / token?.totalSupply / 11);
    return {
        id: address,
        name: token?.name,
        symbol: token?.symbol,
        image: token?.uriData?.image,
        price,
        priceChange: price - oldPrice,
        marketCap: (parseFloat(latestSwap?.price || FAKEINITIALLIQUIDITY * 1e19 / token?.totalSupply / 11) * parseFloat(token?.totalSupply || 0)),
        createdAt: token?.createdAt,
        address: token?.address
    };
}
