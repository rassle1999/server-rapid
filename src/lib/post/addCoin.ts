import supabase from "../basic/database/supabaseClient"
import { v4 as uuidv4 } from 'uuid';
export const addImage = async (file: Express.Multer.File) => {
    const filePath = `upload_images/${file.originalname}&token=${uuidv4()}`;
    const { data, error } = await supabase.storage
        .from('Bucket1')
        .upload(filePath, file.buffer, {
            contentType: file.mimetype
        });
    {
        const { data } = supabase.storage
            .from('Bucket1')
            .getPublicUrl(filePath);
        console.log("url:", data);
        return data.publicUrl;
    }
}
export const addJson = async (name: string, symbol: string, description: string, file: Express.Multer.File) => {
    const image = await addImage(file);
    if (image == "Error") return "Error";
    const jsonData = {
        name: name,
        symbol: symbol,
        image: image,
        description: description,
        twitter: "",
        telegram: "",
        website: ""
    };
    const filePath = `uploads/${file.originalname}.json&token=${uuidv4()}`;  // Path where you want to store the file
    const jsonBlob = new Blob([JSON.stringify(jsonData)], { type: 'application/json' });

    const { data, error } = await supabase.storage
        .from('Bucket1')  // Replace with your bucket name
        .upload(filePath, jsonBlob);
    {
        const { data } = supabase.storage
            .from('Bucket1')
            .getPublicUrl(filePath);
        console.log("Json url:", data);
        return data.publicUrl;
    }
}