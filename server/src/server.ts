import dotenv from "dotenv";
import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { configureCloudinary } from "./config/cloudinary.js";

dotenv.config();

const PORT = Number(process.env.PORT ?? 5000);
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI is not set");
  process.exit(1);
}

try {
  const cloudinaryReady = configureCloudinary(process.env.NODE_ENV === "production");
  console.log(`[server] Cloudinary configured: ${cloudinaryReady.configured}`);
} catch (error) {
  console.error("[server] Cloudinary configuration error:", error instanceof Error ? error.message : String(error));
  process.exit(1);
}

await connectDb(MONGO_URI);
const app = createApp();

app.listen(PORT, () => {
  console.log(`[server] listening on port ${PORT}`);
});

