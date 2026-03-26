const jwt = require('jsonwebtoken');
const User = require('../users/user.model');
const Student = require('../students/student.model');

// Generate JWT
const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
};

// @desc    Auth user & get token (Login)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { username, password } = req.body;

        // Validate email & password
        if (!username || !password) {
            return res.status(400).json({ success: false, message: 'Please provide an username and password' });
        }

        // Check for user
        const user = await User.findOne({ username }).select('+password');

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Parent login: password must match a linked student's matric number (Student.studentId)
        if (user.role === 'parent') {
            const student = await Student.findOne({
                studentId: password,
                parentIds: user._id
            }).select('_id studentId firstName lastName');

            if (!student) {
                return res.status(401).json({ success: false, message: 'Invalid credentials' });
            }

            return sendTokenResponse(user, 200, res, {
                activeStudent: {
                    id: student._id,
                    studentId: student.studentId,
                    firstName: student.firstName,
                    lastName: student.lastName
                }
            });
        }

        // Non-parent login: check bcrypt password
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        return sendTokenResponse(user, 200, res);
    } catch (error) {
        next(error);
    }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);
        res.status(200).json({
            success: true,
            data: user,
        });
    } catch (error) {
        next(error);
    }
};

// Helper function to get token from model, create cookie and send response
const sendTokenResponse = (user, statusCode, res, options = {}) => {
    // Create token
    const tokenPayload = { id: user._id };
    if (options.activeStudent?.id) {
        tokenPayload.studentId = options.activeStudent.id;
    }
    const token = generateToken(tokenPayload);

    res.status(statusCode).json({
        success: true,
        token,
        user: {
            id: user._id,
            username: user.username,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName
        },
        ...(options.activeStudent ? { activeStudent: options.activeStudent } : {})
    });
};
