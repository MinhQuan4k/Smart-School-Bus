const Joi = require('joi');

// Khuôn mẫu kiểm tra Đăng ký
const registerSchema = Joi.object({
    full_name: Joi.string().min(3).required().messages({
        'string.min': 'Họ tên phải có ít nhất 3 ký tự',
        'any.required': 'Thiếu họ tên'
    }),
    phone: Joi.string().pattern(/^[0-9]{10}$/).required().messages({
        'string.pattern.base': 'Số điện thoại không hợp lệ (phải 10 số)'
    }),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'driver', 'parent')
});

// Hàm Middleware để dùng trong Route
const validate = (schema) => (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ success: false, error: error.details[0].message });
    }
    next();
};

module.exports = { validate, registerSchema };