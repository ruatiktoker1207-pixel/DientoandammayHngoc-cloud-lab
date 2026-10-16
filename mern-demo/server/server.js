const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const studentRoutes = require("./routes/students");

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Thiếu biến môi trường MONGODB_URI. Hãy tạo file .env (xem .env.example).");
  process.exit(1);
}

const app = express();

// CORS: chỉ cho phép các origin khai báo trong CLIENT_URL (phân tách bằng dấu phẩy)
// và các địa chỉ dev mặc định. Request không có origin (curl, health check) vẫn được qua.
const allowedOrigins = [
  ...(process.env.CLIENT_URL || "").split(",").map((s) => s.trim()).filter(Boolean),
  "http://localhost:5173",
  "http://localhost:3000",
  "https://mern-frontend-235191.onrender.com",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      const err = new Error(`Origin không được phép: ${origin}`);
      err.status = 403;
      return callback(err);
    },
  })
);

app.use(express.json({ limit: "100kb" }));

app.get("/", (req, res) => res.json({ status: "ok", service: "mern-backend" }));
app.get("/health", (req, res) =>
  res.status(mongoose.connection.readyState === 1 ? 200 : 503).json({
    status: mongoose.connection.readyState === 1 ? "ok" : "db-disconnected",
  })
);

app.use("/api/students", studentRoutes);

// 404
app.use((req, res) => {
  res.status(404).json({ message: "Không tìm thấy đường dẫn" });
});

// Xử lý lỗi chung (CORS, JSON sai cú pháp, ...)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Dữ liệu JSON không hợp lệ" });
  }
  console.error(err.message);
  res.status(err.status || 500).json({ message: err.message || "Lỗi máy chủ" });
});

async function start() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log("Đã kết nối MongoDB");
    // Đảm bảo unique index được tạo trước khi nhận request
    await mongoose.model("Student").init();
  } catch (err) {
    console.error("Không kết nối được MongoDB:", err.message);
    process.exit(1);
  }

  const server = app.listen(PORT, "0.0.0.0", () =>
    console.log(`Server đang chạy tại cổng ${PORT}`)
  );

  const shutdown = (signal) => {
    console.log(`${signal} nhận được, đang tắt server...`);
    server.close(async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start();