export const reg_address = (address:string) =>{
    const new_address=address.slice(0,2)+address.slice(26);
    return new_address;
}