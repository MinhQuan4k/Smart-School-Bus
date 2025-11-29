const { pool } = require("../config/db");

// 1. Lấy danh sách lịch trình (Có thể lọc theo ngày)
async function getAllSchedules(date) {
    let sql = `
        SELECT s.schedule_id, s.date, s.start_time, s.status, 
               r.route_name, b.license_plate, u.full_name as driver_name
        FROM schedules s
        JOIN routes r ON s.route_id = r.route_id
        JOIN buses b ON s.bus_id = b.bus_id
        JOIN users u ON s.driver_id = u.user_id
    `;
    
    const params = [];
    if (date) {
        sql += " WHERE s.date = ?";
        params.push(date);
    }
    
    sql += " ORDER BY s.date DESC, s.start_time ASC";

    const [rows] = await pool.query(sql, params);
    return rows;
}

// 2. Tạo lịch trình MỚI (Bulk Create - Tạo tự động nhiều ngày)
// Hàm này dùng kỹ thuật Recursive CTE để sinh lịch từ ngày A đến ngày B
async function createBulkSchedule({ route_id, bus_id, driver_id, start_date, end_date, start_time }) {
    const sql = `
        INSERT INTO schedules (route_id, bus_id, driver_id, date, start_time, status)
        WITH RECURSIVE date_range AS (
            SELECT ? AS dt -- Ngày bắt đầu
            UNION ALL
            SELECT dt + INTERVAL 1 DAY 
            FROM date_range 
            WHERE dt < ? -- Ngày kết thúc
        )
        SELECT ?, ?, ?, dt, ?, 'pending'
        FROM date_range 
        WHERE DAYOFWEEK(dt) != 1; -- Bỏ qua ngày Chủ Nhật
    `;

    const [result] = await pool.query(sql, [
        start_date, end_date, // Param cho CTE
        route_id, bus_id, driver_id, start_time // Param cho INSERT
    ]);

    return result.affectedRows; // Trả về số lượng lịch đã tạo
}

module.exports = {
    getAllSchedules,
    createBulkSchedule
};