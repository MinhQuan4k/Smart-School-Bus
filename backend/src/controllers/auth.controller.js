const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userModel = require("../models/user.model");
require("dotenv").config();

// --- ĐĂNG KÝ ---
exports.register = async (req, res, next) => {
    try {
        const { full_name, phone, password, role } = req.body;

        // 1. Kiểm tra xem SĐT đã tồn tại chưa
        const existingUser = await userModel.findUserByPhone(phone);
        if (existingUser) {
            return res.status(409).json({ success: false, error: "Số điện thoại đã được sử dụng." });
        }

        // 2. Mã hóa mật khẩu (Hashing) - QUAN TRỌNG
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 3. Lưu vào DB
        const newUserId = await userModel.createUser({
            full_name,
            phone,
            password: hashedPassword,
            role
        });

        res.status(201).json({ 
            success: true, 
            message: "Đăng ký thành công!",
            userId: newUserId 
        });

    } catch (err) {
        next(err);
    }
};

// --- ĐĂNG NHẬP ---
exports.login = async (req, res, next) => {
    try {
        const { phone, password } = req.body;

        // 1. Tìm user trong DB
        const user = await userModel.findUserByPhone(phone);
        if (!user) {
            return res.status(401).json({ success: false, error: "Sai số điện thoại hoặc mật khẩu." });
        }

        // 2. So sánh mật khẩu (Mật khẩu nhập vs Mật khẩu mã hóa trong DB)
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: "Sai số điện thoại hoặc mật khẩu." });
        }

        // 3. Tạo Token (JWT) - "Tấm vé thông hành"
        const payload = {
            id: user.user_id,
            role: user.role,
            name: user.full_name
        };
        
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" }); // Token sống 1 ngày

        // 4. Trả về kết quả
        res.json({
            success: true,
            message: "Đăng nhập thành công.",
            token: token,
            user: {
                id: user.user_id,
                name: user.full_name,
                role: user.role,
                avatar: user.avatar
            }
        });

    } catch (err) {
        next(err);
    }
};