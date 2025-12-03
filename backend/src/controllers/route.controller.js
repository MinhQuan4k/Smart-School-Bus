const routeModel = require("../models/route.model");
const { pool } = require("../config/db"); // Import pool để fix lỗi ReferenceError

// 1. Lấy danh sách tuyến
exports.list = async (req, res, next) => {
    try {
        const data = await routeModel.getAllRoutes();
        res.json({ success: true, data });
    } catch (err) { next(err); }
};

// 2. Tạo tuyến mới
exports.create = async (req, res, next) => {
    try {
        const { route_name, start_point, end_point, estimated_duration } = req.body;
        const newId = await routeModel.createRoute({ 
            route_name, start_point, end_point, estimated_duration 
        });
        res.status(201).json({ success: true, message: "Tạo tuyến mới thành công", id: newId });
    } catch (err) { next(err); }
};

// 3. Cập nhật tuyến
exports.update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const affected = await routeModel.updateRoute(id, req.body);
        if (affected === 0) return res.status(404).json({ error: "Không tìm thấy tuyến đường" });
        res.json({ success: true, message: "Cập nhật thành công" });
    } catch (err) { next(err); }
};

// 4. Xóa tuyến
exports.delete = async (req, res, next) => {
    try {
        const { id } = req.params;
        const affected = await routeModel.deleteRoute(id);
        if (affected === 0) return res.status(404).json({ error: "Không tìm thấy tuyến đường" });
        res.json({ success: true, message: "Đã xóa tuyến đường" });
    } catch (err) { next(err); }
};

// 5. Lấy chi tiết các trạm của 1 tuyến (Để vẽ bản đồ)
exports.getRouteDetails = async (req, res, next) => {
    try {
        const { id } = req.params; // route_id

        const sql = `
            SELECT s.stop_id, s.name, s.latitude, s.longitude, rs.order_index
            FROM route_stops rs
            JOIN stops s ON rs.stop_id = s.stop_id
            WHERE rs.route_id = ?
            ORDER BY rs.order_index ASC
        `;
        
        const [stops] = await pool.query(sql, [id]);
        res.json({ success: true, data: stops });
    } catch (err) { next(err); }
};


// 6. Thêm trạm vào tuyến
exports.addStop = async (req, res, next) => {
    try {
        await routeModel.addStopToRoute(req.body);
        res.json({ success: true, message: "Đã thêm trạm vào tuyến" });
    } catch (err) { next(err); }
};

// 7. Gỡ trạm khỏi tuyến
exports.removeStop = async (req, res, next) => {
    try {
        const { id, stopId } = req.params; // id là route_id
        await routeModel.removeStopFromRoute(id, stopId);
        res.json({ success: true, message: "Đã gỡ trạm khỏi tuyến" });
    } catch (err) { next(err); }
};