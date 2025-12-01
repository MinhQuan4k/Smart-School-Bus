const stopModel = require("../models/stop.model");

exports.list = async (req, res, next) => {
    try {
        const data = await stopModel.getAllStops();
        res.json({ success: true, data });
    } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
    try {
        const { name, address, latitude, longitude } = req.body;
        if (!name || !latitude || !longitude) return res.status(400).json({ error: "Thiếu tên hoặc tọa độ" });
        
        await stopModel.createStop(req.body);
        res.status(201).json({ success: true, message: "Tạo trạm thành công" });
    } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
    try {
        await stopModel.deleteStop(req.params.id);
        res.json({ success: true, message: "Đã xóa trạm" });
    } catch (err) { next(err); }
};