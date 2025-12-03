// File này dùng để reset mật khẩu toàn bộ user thành "123"
// Chạy lệnh: node reset_pass.js

require("dotenv").config();
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");

async function resetAllPasswords() {
    console.log("⏳ Đang kết nối Database...");
    
    // 1. Kết nối DB
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || "root",
        password: process.env.DB_PASS || "Tbthsghj1357",
        database: process.env.DB_NAME || "ssb_bus_tracking",
        port: process.env.DB_PORT || 3306
    });

    console.log("✅ Kết nối thành công!");

    // 2. Tạo mã Hash chuẩn từ máy tính của BẠN
    const plainPassword = "123";
    const saltRounds = 10;
    console.log(`🔄 Đang mã hóa mật khẩu "${plainPassword}"...`);
    
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    console.log(`🔑 Mã Hash mới: ${hashedPassword}`);

    // 3. Cập nhật vào Database
    console.log("💾 Đang cập nhật vào MySQL...");
    const [result] = await connection.query("UPDATE users SET password = ?", [hashedPassword]);

    console.log("---------------------------------------------------");
    console.log(`🎉 THÀNH CÔNG! Đã cập nhật mật khẩu cho ${result.affectedRows} tài khoản.`);
    console.log(`👉 Bây giờ bạn có thể đăng nhập tất cả user với mật khẩu: 123`);
    console.log("---------------------------------------------------");

    await connection.end();
}

resetAllPasswords().catch(err => {
    console.error("❌ Lỗi:", err.message);
});