import express, { Request, Response } from "express";
import multer from "multer";
import { addJson } from "../../lib/post/addCoin";
const storage = multer.memoryStorage(); // or multer.diskStorage({ ... })
const upload = multer({ storage: storage });
const router2 = express.Router();
router2.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  const { name, symbol, description } = req.body;
  if (file == undefined) {
    res.send("undefined");
    return;
  }
  const publicUrl = await addJson(name, symbol, description, file);
  res.send({ publicUrl: publicUrl });
});
export default router2;