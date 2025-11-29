require("dotenv").config(); // Load biến môi trường từ file .env
const mysql = require("mysql2");

// 1. Tạo Pool kết nối
const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER ,
    password: process.env.DB_PASSWORD ,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306,
    
    // Cấu hình nâng cao cho Pool
    waitForConnections: true,
    connectionLimit: 10, // Tối đa 10 kết nối cùng lúc
    queueLimit: 0,
    
    // Giữ ngày tháng đúng định dạng khi trả về từ DB
    dateStrings: true 
});

// 2. Kiểm tra kết nối khi khởi động Server
pool.getConnection((err, connection) => {
    if (err) {
        console.error("Kết nối Database thất bại:", err.message);
    } else {
        console.log("Đã kết nối thành công đến MySQL Database!");
        connection.release(); // Trả kết nối về hồ chứa
    }
});

// 3. Xuất ra dạng Promise để dùng async/await (quan trọng)
// Giúp bạn viết: const [rows] = await pool.query(...) thay vì dùng callback
module.exports = {
    pool: pool.promise() 
};