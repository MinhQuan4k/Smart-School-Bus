const jwt = require("jsonwebtoken");
require("dotenv").config();

// Middleware: Kiểm tra xem đã đăng nhập chưa
exports.verifyToken = (req, res, next) => {
    const token = req.headers["authorization"]; // Lấy token từ header

    if (!token) {
        return res.status(403).json({ error: "Không có quyền truy cập (Thiếu Token)" });
    }

    try {
        // Cắt bỏ chữ "Bearer " nếu có
        const cleanToken = token.replace("Bearer ", "");
        const decoded = jwt.verify(cleanToken, process.env.JWT_SECRET);
        
        req.user = decoded; // Lưu thông tin user vào biến req để dùng sau
        next(); // Cho phép đi tiếp
    } catch (err) {
        return res.status(401).json({ error: "Token không hợp lệ hoặc đã hết hạn" });
    }
};

// Middleware: Chỉ cho phép Admin
exports.isAdmin = (req, res, next) => {
    if (req.user.role !== "admin") {
        return res.status(403).json({ error: "Chỉ Admin mới được thực hiện thao tác này" });
    }
    next();
};