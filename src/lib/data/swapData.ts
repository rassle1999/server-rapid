import { client } from "../basic/database/mongoClient"
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
            { sort: { date: -1 } }
        );
    let query;
    if (startDoc === null) {
        query = {
            token: { $regex: `^${tokenAddress}$`, $options: "i" },
        };
    }
    else {
        query = {
            token: { $regex: `^${tokenAddress}$`, $options: "i" },
            date: { $gte: startDoc.date }
        };
    }
    const data = await client
        .db("database1")
        .collection("swaps_real")
        .find(query)
        .sort({ date: -1 })
        .toArray();
    const priceData = [];
    for (var i = 0; i < stepCount; i++) {
        const pos = posA + i * step;
        const price = data.find((d) => (d.date < pos))?.price || 0;
        priceData.push({ time: pos, price: price });
    }
    const price = data.find((d) => (d.date < currentTime))?.price || 0;
    priceData.push({ time: currentTime, price: price });
    return priceData;
}