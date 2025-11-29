const busModel = require("../models/bus.model");

exports.list = async (req, res, next) => {
    try {
        const data = await busModel.getAllBuses();
        res.json({ success: true, data });
    } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
    try {
        await busModel.createBus(req.body);
        res.json({ success: true, message: "Thêm xe thành công" });
    } catch (err) { next(err); }
};

exports.delete = async (req, res, next) => {
    try {
        await busModel.deleteBus(req.params.id);
        res.json({ success: true, message: "Đã xóa xe" });
    } catch (err) { next(err); }
};