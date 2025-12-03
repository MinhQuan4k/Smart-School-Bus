const routeModel = require("../models/route.model");
const { pool } = require("../config/db"); 

exports.list = async (req, res, next) => {
    try {
        const data = await routeModel.getAllRoutes();
        res.json({ success: true, data });
    } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
    try {
        // Lấy thêm estimated_duration từ body
        const { route_name, start_point, end_point, estimated_duration } = req.body;
        
        const newId = await routeModel.createRoute({ 
            route_name, start_point, end_point, estimated_duration 
        });
        
        res.status(201).json({ success: true, message: "Tạo tuyến mới thành công", id: newId });
    } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const affected = await routeModel.updateRoute(id, req.body);
        
        if (affected === 0) return res.status(404).json({ error: "Không tìm thấy tuyến đường" });
        res.json({ success: true, message: "Cập nhật thành công" });
    } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
    try {
        const { id } = req.params;
        const affected = await routeModel.deleteRoute(id);
        if (affected === 0) return res.status(404).json({ error: "Không tìm thấy tuyến đường" });
        res.json({ success: true, message: "Đã xóa tuyến đường" });
    } catch (err) { next(err); }
};

// API Mới: Lấy chi tiết các trạm của 1 tuyến
exports.getRouteDetails = async (req, res, next) => {
    try {
        const { id } = req.params; // route_id

        // Lấy thông tin trạm theo thứ tự
        const sql = `
            SELECT s.stop_id, s.name, s.latitude, s.longitude, rs.order_index
            FROM route_stops rs
            JOIN stops s ON rs.stop_id = s.stop_id
            WHERE rs.route_id = ?
            ORDER BY rs.order_index ASC
        `;
        
        // Bây giờ biến 'pool' đã được import nên sẽ chạy tốt
        const [stops] = await pool.query(sql, [id]);
        
        res.json({ success: true, data: stops });
    } catch (err) { next(err); }
};