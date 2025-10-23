import { client } from "./mongoClient"
export const getVolumeData =async () =>{
    const swapData = await client.db("database1").collection("swaps_real").find({}).toArray();  
    const swap_part1 = swapData.slice(0,-10); 
    const swap_part2 = swapData.slice(-10); 
    const sum = swap_part1.reduce((sum:Number,swap:any)=>{
        if(swap.direction==true){
            sum+=swap.amountIn;
        }
        else{

        }
        return sum;
    },0)
}