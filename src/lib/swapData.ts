import { client } from "./mongoClient"
export const getSwapData = async () => {
    const tokenData = await client.db("database1").collection("tokens_real").find({}).toArray();
    const swapDataArrays = await Promise.all(
        tokenData.map(async (token: any) => {
            console.log("token.address:", token.address)
            return await client
                .db("database1")
                .collection("swaps_real")
                .find({ token: { $regex: `^${token.address}$`, $options: "i" } })
                .sort({ _id: -1 })
                .limit(10)
                .toArray();
        })
    );

    // Flatten all results into one array
    const swapData = swapDataArrays.flat();
    // const swapData = await client.db("database1").collection("swaps_real").find({}).sort({ _id: -1 }).limit(300).toArray();
    console.log("data:", swapData);
    return swapData;
}
export const getSwapDatabyToken = async (tokenAddress: string, currentTime: number, step: number, stepCount: number, left: number) => {
    const posA = currentTime - step * stepCount - left;
    const startDoc = await client
        .db("database1")
        .collection("swaps_real")
        .findOne(
            {
                token: { $regex: `^${tokenAddress}$`, $options: "i" },
                date: { $lt: posA }
            },
            { sort: { date: -1 } } // newest before stepA
        );
    let query;
    if (startDoc === null) {
        query = {
            token: { $regex: `^${tokenAddress}$`, $options: "i" },// everything after that document
        };
    }
    else {
        query = {
            token: { $regex: `^${tokenAddress}$`, $options: "i" },
            date: { $gte: startDoc.date } // everything after that document
        };
    }

    const data = await client
        .db("database1")
        .collection("swaps_real")
        .find(query)
        .sort({ date: -1 }) // oldest → newest
        .toArray();
    const priceData = [];
    for (var i = 0; i < stepCount; i++) {
        const pos = posA + i * step;
        const price = data.find((d) => (d.date < pos))?.price || 0;
        priceData.push({time:pos,price:price});
    }
    const price = data.find((d) => (d.date < currentTime))?.price || 0;
    priceData.push({time:currentTime,price:price});
    return priceData;
}