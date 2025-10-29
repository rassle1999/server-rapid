import { client } from "../basic/mongoClient";
export const tokenDatabyDate = async (page: string, search?: string) => {
    const tokens = await client
        .db("database1")
        .collection("tokens_real")
        .find({})
        .sort({ createdAt: 1 })
        .skip((parseInt(page) - 1) * 6)
        .limit(6)
        .toArray();
    const tokenAddresses = tokens.map(t => new RegExp(`^${t.address}$`, "i"));

    const now = Date.now() / 1000;

    // Get latest swaps
    const latestSwaps = await client.db("database1")
        .collection("swaps_real")
        .aggregate([
            { $match: { token: { $in: tokenAddresses } } },
            { $sort: { date: -1 } },
            { $group: { _id: "$token", swap: { $first: "$$ROOT" } } }
        ])
        .toArray();

    // Get swaps from 24h before
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

        const price = parseFloat(swap?.price || 0);
        const oldPrice = parseFloat(swapBefore?.price || 0);

        return {
            id: token.address,
            name: token.name,
            symbol: token.symbol,
            image: token.uriData?.image,
            price,
            priceChange: price - oldPrice,
            marketCap: (parseFloat(swap?.price || 0) * parseFloat(token.totalSupply || 0)),
            createdAt: token.createdAt,
            address: token.address
        };
    });
    return tokenData;
}
export const tokenDatabyMarketCap = async (page: string, search?: string) => {
    const now = Date.now() / 1000;
    const tokens = await client
        .db("database1")
        .collection("tokens_real")
        .aggregate([
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
                    price: 1,
                    priceChange: 1,
                    totalSupply: "$totalSupply",
                    createdAt: "$createdAt",
                    marketCap: 1
                }
            },
            { $sort: { marketCap: -1 } },
            { $skip: (parseInt(page) - 1) * 6 },
            { $limit: 6 }
        ])
        .toArray();
    console.log("Market Cap:", tokens);
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
                            then: 0,
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
                            then: 0,
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
    console.log("tokenData:", tokens.length);
    return tokens;
}
export const tokenDatabyAddress = async (address: string) => {
    const token = await client
        .db("database1")
        .collection("tokens_real")
        .findOne({ address: { $regex: `^${address}$`, $options: "i" } });

    const now = Date.now() / 1000;

    // Get latest swaps
    const latestSwap = await client.db("database1")
        .collection("swaps_real")
        .findOne({ token: { $regex: `^${address}$`, $options: "i" } }, { sort: { date: -1 } })

    // Get swaps from 24h before
    const swapBefore = await client.db("database1")
        .collection("swaps_real")
        .findOne(
            { token: { $regex: `^${address}$`, $options: "i" }, date: { $lt: now - 24 * 60 * 60 } },
            { sort: { date: -1 } }
        );
    const price = parseFloat(latestSwap?.price || 0) / 1e18;
    const oldPrice = parseFloat(swapBefore?.price || 0) / 1e18;

    return {
        id: address,
        name: token?.name,
        symbol: token?.symbol,
        image: token?.uriData?.image,
        price,
        priceChange: price - oldPrice,
        marketCap: (parseFloat(latestSwap?.price || 0) * parseFloat(token?.totalSupply || 0)) / 1e36,
        createdAt: token?.createdAt,
        address: token?.address
    };
}
export const getMarketCapData = async () => {
    const now = Date.now() / 1000;
    const tokens = await client
        .db("database1")
        .collection("tokens_real")
        .aggregate([
            {
                $lookup: {
                    from: "swaps_real",
                    let: { addr: { $toLower: "$address" } },
                    pipeline: [
                        {
                            $match: { $expr: { $eq: [{ $toLower: "$token" }, "$$addr"] } }
                        },
                        { $sort: { "date": 1 } },
                    ],
                    as: "swap"
                }
            },
            { $unwind: { path: "$swap" } },
            // {
            //     $match: {
            //         date: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
            //     }
            // },
            // { $sort: { date: 1 } },
            {
                $setWindowFields: {
                    partitionBy: "$token", // per token
                    sortBy: { date: 1 },
                    output: {
                        lastMarketCap: {
                            $last: {
                                $multiply: [
                                    { $toDouble: "$swap.price" },
                                    { $toDouble: "$totalSupply" }
                                ]
                            },
                            window: { documents: ["unbounded", "current"] }
                        }
                    }
                }
            },
            // {
            //     $group: {
            //         _id: {
            //             $dateTrunc: {
            //                 date: "$date",
            //                 unit: "minute",
            //                 binSize: 5
            //             }
            //         },
            //         totalMarketCap: { $sum: "$lastMarketCap" }
            //     }
            // },
            // { $sort: { _id: 1 } }
        ])
        .toArray();
    console.log("Chart:", tokens.length);
    return tokens;
}