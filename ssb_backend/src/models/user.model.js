const { pool } = require("../config/db");

// 1. Tìm user bằng số điện thoại (Dùng cho đăng nhập)
async function findUserByPhone(phone) {
    const [rows] = await pool.query("SELECT * FROM users WHERE phone = ?", [phone]);
    return rows[0]; // Trả về user đầu tiên tìm thấy hoặc undefined
}

// 2. Tạo user mới (Dùng cho đăng ký)
async function createUser(userData) {
    const { full_name, phone, password, role } = userData;
    
    // role mặc định là 'parent' nếu không truyền vào
    const [result] = await pool.query(
        "INSERT INTO users (full_name, phone, password, role) VALUES (?, ?, ?, ?)",
        [full_name, phone, password, role || 'parent']
    );

    return result.insertId; // Trả về ID của user vừa tạo
}

// 3. Tìm user theo ID (Dùng để lấy thông tin profile)
async function findUserById(id) {
    const [rows] = await pool.query(
        "SELECT user_id, full_name, phone, role, avatar FROM users WHERE user_id = ?", 
        [id]
    );
    return rows[0];
}

module.exports = {
    findUserByPhone,
    createUser,
    findUserById
};