require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const { pool } = require("./src/config/db"); // Kết nối DB

// 1. Khởi tạo App
const app = express();
const server = http.createServer(app);

// 2. Cấu hình Socket
const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});


// =======================================================
// 3. MIDDLEWARES (PHẢI NẰM TRÊN CÙNG - TRƯỚC MỌI ROUTE)
// =======================================================
app.use(express.json()); 
app.use(helmet());
app.use(cors());
app.use(morgan("dev"));

// Middleware gán biến 'io'
app.use((req, res, next) => {
    req.io = io;
    next();
});
// Rate Limiter
const rateLimit = require("express-rate-limit");

// Cấu hình bộ giới hạn
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Tối đa 100 request mỗi IP
  message: "Bạn đã gửi quá nhiều yêu cầu, vui lòng thử lại sau 15 phút."
});

// =======================================================
// 4. ROUTES (NẰM SAU MIDDLEWARES)
// =======================================================
const authRoutes = require("./src/routes/auth.routes");
const scheduleRoutes = require("./src/routes/schedule.routes");
const trackingRoutes = require("./src/routes/tracking.routes");
const notiRoutes = require("./src/routes/notification.routes");
const studentRoutes = require("./src/routes/student.routes"); 
const routeRoutes = require("./src/routes/route.routes");
const busRoutes = require("./src/routes/bus.routes");
const driverRoutes = require("./src/routes/driver.routes");
const parentRoutes = require("./src/routes/parent.routes");
const reportRoutes = require("./src/routes/report.routes");
const userRoutes = require("./src/routes/user.routes");
const incidentRoutes = require("./src/routes/incident.routes");
const stopRoutes = require("./src/routes/stop.routes");
app.get("/", (req, res) => res.send("SSB Backend Server is running..."));

// Các API chính
app.use("/api/auth", authRoutes);
app.use("/api/schedules", scheduleRoutes);
app.use("/api/tracking", trackingRoutes);
app.use("/api/notifications", notiRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/routes", routeRoutes);
app.use("/api/buses", busRoutes);
app.use("/api/driver", driverRoutes);
app.use("/api/parent", parentRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/stops", stopRoutes);
app.use("/api", limiter);

// =======================================================
// 5. SERVER START
// =======================================================
io.on("connection", (socket) => {
    console.log(">> Socket connected:", socket.id);
    require("./src/sockets/tracking.socket")(io, socket);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`✅ Server đang chạy tại Port: ${PORT}`);
});