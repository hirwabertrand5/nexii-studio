import dotenv from "dotenv";
import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";

dotenv.config();

const PORT = Number(process.env.PORT ?? 5000);
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("MONGO_URI is not set");
  process.exit(1);
}

await connectDb(MONGO_URI);
const app = createApp();

app.listen(PORT, () => {
  console.log(`[server] listening on port ${PORT}`);
});

