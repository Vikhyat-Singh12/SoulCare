import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
    // --- Common fields for all roles ---
    name: {
        type: String,
        required: true,
        trim: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    // Store as String to preserve leading zeros and international formats
    mobile: {
        type: String,
        sparse: true,
        unique: true,
    },
    role: {
        type: String,
        enum: ['student', 'counsellor', 'admin'],
        default: 'student',
    },
    profileUrl: {
        type: String,
        default: '',
    },

    // --- Student-specific fields ---
    anonymous_id: {
        type: String,
        sparse: true,
        unique: true,
    },
    
    // Fixed typo: roolNo → rollNo
    rollNo: {
        type: String,
        sparse: true,
        unique: true,
    },
    stream: {
        type: String,
        trim: true,
    },
    academicYear: {
        type: String,
        trim: true,
    },

    // --- Counsellor-specific fields ---
    // sparse: true allows multiple documents with null c_id (students)
    c_id: {
        type: String,
        unique: true,
        sparse: true,
        trim: true,
    },
    about: {
        type: String,
        trim: true,
    },
    experience: {
        type: Number,
    },
    specialization: {
        type: String,
        trim: true,
    },
    qualification: {
        type: String,
        trim: true,
    },
}, { timestamps: true });


// Hash password only when it is modified
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
