const { pool } = require("../config/db");

// 1. Lấy tất cả học sinh (Kèm tên phụ huynh)
async function getAllStudents() {
    const sql = `
        SELECT s.*, u.full_name as parent_name, u.phone as parent_phone
        FROM students s
        JOIN users u ON s.parent_id = u.user_id
        ORDER BY s.student_id DESC
    `;
    const [rows] = await pool.query(sql);
    return rows;
}

// 2. Lấy chi tiết 1 học sinh
async function getStudentById(id) {
    const [rows] = await pool.query("SELECT * FROM students WHERE student_id = ?", [id]);
    return rows[0];
}

// 3. Thêm học sinh mới
async function createStudent({ parent_id, full_name, class_name, pickup_address }) {
    const [result] = await pool.query(
        "INSERT INTO students (parent_id, full_name, class_name, pickup_address) VALUES (?, ?, ?, ?)",
        [parent_id, full_name, class_name, pickup_address]
    );
    return result.insertId;
}

// 4. Cập nhật học sinh
async function updateStudent(id, { full_name, class_name, pickup_address }) {
    const [result] = await pool.query(
        "UPDATE students SET full_name = ?, class_name = ?, pickup_address = ? WHERE student_id = ?",
        [full_name, class_name, pickup_address, id]
    );
    return result.affectedRows;
}

// 5. Xóa học sinh
async function deleteStudent(id) {
    const [result] = await pool.query("DELETE FROM students WHERE student_id = ?", [id]);
    return result.affectedRows;
}

module.exports = {
    getAllStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent
};