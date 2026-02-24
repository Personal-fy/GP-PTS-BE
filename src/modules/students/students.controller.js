const Student = require('./student.model');

// @desc    Get all students
// @route   GET /api/students
// @access  Private/Admin|Teacher
exports.getStudents = async (req, res, next) => {
    try {
        const students = await Student.find().populate('parentIds', 'firstName lastName email').populate('courseIds', 'courseName');
        res.status(200).json({
            success: true,
            count: students.length,
            data: students
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Get single student
// @route   GET /api/students/:id
// @access  Private/Admin|Teacher
exports.getStudent = async (req, res, next) => {
    try {
        const student = await Student.findById(req.params.id)
            .populate('parentIds', 'firstName lastName email')
            .populate('courseIds', 'courseName');

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        res.status(200).json({
            success: true,
            data: student
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Create student
// @route   POST /api/students
// @access  Private/Admin
exports.createStudent = async (req, res, next) => {
    try {
        const student = await Student.create(req.body);

        res.status(201).json({
            success: true,
            data: student
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Update student
// @route   PUT /api/students/:id
// @access  Private/Admin
exports.updateStudent = async (req, res, next) => {
    try {
        const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        res.status(200).json({
            success: true,
            data: student
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Delete student
// @route   DELETE /api/students/:id
// @access  Private/Admin
exports.deleteStudent = async (req, res, next) => {
    try {
        await Student.findByIdAndDelete(req.params.id);

        res.status(200).json({
            success: true,
            data: {}
        });
    } catch (error) {
        next(error);
    }
};
