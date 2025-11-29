require("dotenv").config(); // 1. Load biến môi trường đầu tiên
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");


const { pool } = require("./src/config/db"); // Kết nối Database
// Khởi tạo App
const app = express();
const server = http.createServer(app); // Tạo server bọc lấy Express

// Cấu hình Socket.io (Real-time)
const io = socketIo(server, {
    cors: {
        origin: "*", // Cho phép mọi nguồn kết nối (trong dev), khi deploy nên sửa lại
        methods: ["GET", "POST"]
    }
});

// ================= MIDDLEWARES =================
app.use(helmet()); // Bảo mật
app.use(cors()); // Cho phép gọi API từ bên ngoài
app.use(express.json()); // Đọc dữ liệu JSON từ client gửi lên
app.use(morgan("dev")); // Log request ra màn hình console

// Middleware gán biến 'io' vào mọi request để dùng trong Controller
app.use((req, res, next) => {
    req.io = io;
    next();
});

// ================= ROUTES =================
// Test route
app.get("/", (req, res) => {
    res.send("SSB Backend Server is running...");
});

// Import các routes của bạn ở đây
// const parentRoutes = require("./src/routes/parent.routes");
// app.use("/api/parents", parentRoutes);

// ================= SOCKET.IO EVENTS =================
io.on("connection", (socket) => {
    console.log(">> Có người kết nối socket:", socket.id);

    socket.on("disconnect", () => {
        console.log("<< Đã ngắt kết nối:", socket.id);
    });
    
    // Import logic socket riêng tại đây nếu cần
    // require("./src/sockets/tracking.socket")(io, socket);
});

// ================= START SERVER =================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(` Server đang chạy tại: http://localhost:${PORT}`);
});