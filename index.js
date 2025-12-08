import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import deviceRouter from "./routes/device.route.js";
import { connectDB } from "./config/db.config.js";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd(), "public")));

app.use("/api/devices", deviceRouter);

const PORT = process.env.PORT || 5000;

await connectDB();
app.get("/", (req, res) => {
  res.send("Server is running !");
});
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
