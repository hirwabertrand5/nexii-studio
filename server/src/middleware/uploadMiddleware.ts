import multer from "multer";

// Use memory storage so we can stream to providers
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20 MB per file
  }
});

export default uploadMiddleware;
