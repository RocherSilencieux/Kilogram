import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import router from "./routes";

dotenv.config();

const uploadsDir = path.join(__dirname, "..", "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

const rawFrontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const frontendUrl = rawFrontendUrl.replace(/\/$/, "");

// Restrict CORS to the frontend domain (tolerant to trailing slash)
app.use(
  cors({
    origin: [frontendUrl, `${frontendUrl}/`],
  })
);
app.use(express.json());
app.use("/uploads", express.static(uploadsDir));
app.use(express.static(path.join(__dirname, "..", "public")));

app.use(router);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
