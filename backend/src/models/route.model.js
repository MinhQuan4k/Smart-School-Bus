const { pool } = require("../config/db");

async function getAllRoutes() {
    const [rows] = await pool.query("SELECT * FROM routes ORDER BY route_id ASC");
    return rows;
}

async function createRoute({ route_name, start_point, end_point }) {
    const [result] = await pool.query(
        "INSERT INTO routes (route_name, start_point, end_point) VALUES (?, ?, ?)",
        [route_name, start_point, end_point]
    );
    return result.insertId;
}

async function updateRoute(id, { route_name, start_point, end_point }) {
    const [result] = await pool.query(
        "UPDATE routes SET route_name = ?, start_point = ?, end_point = ? WHERE route_id = ?",
        [route_name, start_point, end_point, id]
    );
    return result.affectedRows;
}

async function deleteRoute(id) {
    const [result] = await pool.query("DELETE FROM routes WHERE route_id = ?", [id]);
    return result.affectedRows;
}

module.exports = { 
    getAllRoutes, 
    createRoute, 
    updateRoute, 
    deleteRoute 
};