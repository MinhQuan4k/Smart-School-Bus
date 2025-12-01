const { pool } = require("../config/db");

// 1. Lấy danh sách tất cả trạm
async function getAllStops() {
    const [rows] = await pool.query("SELECT * FROM stops ORDER BY name ASC");
    return rows;
}

// 2. Tạo trạm mới (Có tọa độ)
async function createStop({ name, address, latitude, longitude }) {
    const [result] = await pool.query(
        "INSERT INTO stops (name, address, latitude, longitude) VALUES (?, ?, ?, ?)",
        [name, address, latitude, longitude]
    );
    return result.insertId;
}

// 3. Xóa trạm
async function deleteStop(id) {
    const [result] = await pool.query("DELETE FROM stops WHERE stop_id = ?", [id]);
    return result.affectedRows;
}

module.exports = { getAllStops, createStop, deleteStop };