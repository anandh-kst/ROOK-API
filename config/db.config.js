import mongoose from "mongoose";
let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    console.log("MongoDB already connected. Reusing existing connection.");
    return;
  }
  try {
    const db = await mongoose.connect(process.env.MONGO_URL, {
      dbName: "ROOK-API",
      maxPoolSize: 10,
    });
    isConnected = db.connections[0].readyState === 1;
    console.log("MongoDB Connected Successfully");
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export const mainDB = mongoose.connection;
export const authDB = mainDB.useDb("AUTH", { useCache: true });
export const webhookDB = mainDB.useDb("newDevelopment", { useCache: true });
