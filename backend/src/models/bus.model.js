const { pool } = require("../config/db");

async function getAllBuses() {
    const [rows] = await pool.query("SELECT * FROM buses ORDER BY bus_id ASC");
    return rows;
}

async function createBus({ license_plate, brand, capacity }) {
    const [result] = await pool.query(
        "INSERT INTO buses (license_plate, brand, capacity) VALUES (?, ?, ?)",
        [license_plate, brand, capacity]
    );
    return result.insertId;
}

async function deleteBus(id) {
    const [result] = await pool.query("DELETE FROM buses WHERE bus_id = ?", [id]);
    return result.affectedRows;
}

module.exports = { getAllBuses, createBus, deleteBus };