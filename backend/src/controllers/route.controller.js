const routeModel = require("../models/route.model");

exports.list = async (req, res, next) => {
    try {
        const data = await routeModel.getAllRoutes();
        res.json({ success: true, data });
    } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
    try {

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