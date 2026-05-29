import mongoose from "mongoose";

export async function connectDb(mongoUri: string) {
  try {
    const conn = await mongoose.connect(mongoUri);
    console.log(`[db] connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (err) {
    console.error("[db] connection failed", err);
    process.exit(1);
  }
}

