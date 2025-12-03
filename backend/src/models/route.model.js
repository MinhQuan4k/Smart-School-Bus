const { pool } = require("../config/db");

async function getAllRoutes() {
    // Sắp xếp theo ID
    const [rows] = await pool.query("SELECT * FROM routes ORDER BY route_id ASC");
    return rows;
}


async function createRoute({ route_name, start_point, end_point, estimated_duration }) {
    const [result] = await pool.query(
        "INSERT INTO routes (route_name, start_point, end_point, estimated_duration) VALUES (?, ?, ?, ?)",
        [route_name, start_point, end_point, estimated_duration || 60]
    );  
    return result.insertId;
}

async function updateRoute(id, { route_name, start_point, end_point, estimated_duration }) {
    const [result] = await pool.query(
        "UPDATE routes SET route_name = ?, start_point = ?, end_point = ?, estimated_duration = ? WHERE route_id = ?",
        [route_name, start_point, end_point, estimated_duration || 60, id]
    );
    return result.affectedRows;
}

async function deleteRoute(id) {
    const [result] = await pool.query("DELETE FROM routes WHERE route_id = ?", [id]);
    return result.affectedRows;
}
// Thêm trạm vào tuyến
async function addStopToRoute({ route_id, stop_id, order_index, minutes_from_start }) {
    const [result] = await pool.query(
        "INSERT INTO route_stops (route_id, stop_id, order_index, minutes_from_start) VALUES (?, ?, ?, ?)",
        [route_id, stop_id, order_index, minutes_from_start]
    );
    return result.insertId;
}

// Xóa trạm khỏi tuyến
async function removeStopFromRoute(route_id, stop_id) {
    const [result] = await pool.query(
        "DELETE FROM route_stops WHERE route_id = ? AND stop_id = ?",
        [route_id, stop_id]
    );
    return result.affectedRows;
}


module.exports = { getAllRoutes, createRoute, updateRoute, deleteRoute , addStopToRoute, removeStopFromRoute};