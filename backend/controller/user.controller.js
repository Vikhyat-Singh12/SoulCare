import User from '../models/user.model.js';
import cloudinary from '../utils/cloudinary.js';
import jwt from 'jsonwebtoken';

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateAnonymousId() {
  const randomNum = Math.floor(1000 + Math.random() * 9000);
  return `User-${randomNum}`;
}

/**
 * Upload a buffer to Cloudinary and return the secure URL.
 * Throws on failure so the caller can handle it.
 */
async function uploadToCloudinary(buffer, folder = 'soulcare') {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { resource_type: 'auto', folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
}

/**
 * Sign a JWT and set it as an HTTP-only cookie.
 */
export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.cookie('jwt', token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV !== 'development',
  });

  return token;
};

/**
 * Return a safe user object with no password field.
 */
function safeUser(user) {
  const obj = user.toObject();
  delete obj.password;
  return obj;
}

// ─── Auth Controllers ────────────────────────────────────────────────────────

export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: 'Please fill all fields' });

    if (password.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists)
      return res.status(400).json({ message: 'User already exists with this email' });

    // Use create() only — the pre('save') hook hashes the password once
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      anonymous_id: generateAnonymousId(),
    });

    generateToken(user._id, res);

    return res.status(201).json({
      message: 'User registered successfully',
      user: safeUser(user),
    });
  } catch (error) {
    console.error('Error in signup:', error.message);
    res.status(500).json({ message: 'Server error during signup' });
  }
};


export const addCounsellor = async (req, res) => {
  try {
    const { name, c_id, email, specialization, qualification, experience, mobile, about } = req.body;

    // 1. Validate BEFORE touching Cloudinary
    if (!name || !c_id || !specialization || !qualification || !experience || !mobile || !about || !email)
      return res.status(400).json({ message: 'Please fill all fields' });

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists)
      return res.status(400).json({ message: 'A user with this email already exists' });

    const counsellorExists = await User.findOne({ c_id: c_id.trim() });
    if (counsellorExists)
      return res.status(400).json({ message: 'A counsellor with this ID already exists' });

    // 2. Upload image if provided
    let imageUrl = '';
    if (req.file) {
      try {
        imageUrl = await uploadToCloudinary(req.file.buffer, 'soulcare/counsellors');
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ message: 'Failed to upload profile image' });
      }
    }

    // 3. Create counsellor — pre('save') hook hashes password once
    const user = await User.create({
      name,
      c_id: c_id.trim(),
      email: email.toLowerCase(),
      password: `${c_id.trim()}@123`, // default password
      specialization,
      qualification,
      experience: Number(experience),
      mobile,
      about,
      profileUrl: imageUrl,
      role: 'counsellor',
    });

    // 4. Never expose the password hash
    return res.status(201).json({
      message: 'Counsellor registered successfully',
      user: safeUser(user),
    });
  } catch (error) {
    console.error('Error in addCounsellor:', error.message);
    res.status(500).json({ message: 'Server error while adding counsellor' });
  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ message: 'Please provide email and password' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user)
      return res.status(400).json({ message: 'Invalid email or password' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid email or password' });

    generateToken(user._id, res);

    return res.status(200).json({
      message: 'Login successful',
      user: safeUser(user),
    });
  } catch (error) {
    console.error('Error in login:', error.message);
    res.status(500).json({ message: 'Server error during login' });
  }
};


export const logout = async (req, res) => {
  try {
    res.clearCookie('jwt', {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV !== 'development',
    });
    return res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Error in logout:', error.message);
    res.status(500).json({ message: 'Server error during logout' });
  }
};


export const getMe = async (req, res) => {
  try {
    // req.user is already populated by middleware (no password)
    return res.status(200).json({ user: req.user });
  } catch (error) {
    console.error('Error in getMe:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
};


export const editProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user)
      return res.status(404).json({ message: 'User not found' });

    // Student fields
    const { name, rollNo, mobile, stream, academicYear } = req.body;

    // Upload new profile image if provided
    if (req.file) {
      try {
        const imageUrl = await uploadToCloudinary(req.file.buffer, 'soulcare/profiles');
        user.profileUrl = imageUrl;
      } catch (uploadError) {
        console.error('Cloudinary upload error:', uploadError);
        return res.status(500).json({ message: 'Failed to upload profile image' });
      }
    }

    // Only update fields that were actually sent
    if (name !== undefined) user.name = name;
    if (rollNo !== undefined) user.rollNo = rollNo;      // fixed typo
    if (mobile !== undefined) user.mobile = mobile;
    if (stream !== undefined) user.stream = stream;
    if (academicYear !== undefined) user.academicYear = academicYear;

    const updatedUser = await user.save();

    return res.status(200).json({
      message: 'Profile updated successfully',
      user: safeUser(updatedUser),
    });
  } catch (error) {
    console.error('Error in editProfile:', error.message);
    res.status(500).json({ message: 'Server error while updating profile' });
  }
};


export const getAllCounsellors = async (req, res) => {
  try {
    // Never return passwords
    const counsellors = await User.find({ role: 'counsellor' }).select('-password');
    return res.status(200).json({ counsellors });
  } catch (error) {
    console.error('Error in getAllCounsellors:', error.message);
    res.status(500).json({ message: 'Server error while fetching counsellors' });
  }
};


// Uses route param /:id — DELETE /api/auth/deletecounsellor/:id
export const deleteCounsellor = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id)
      return res.status(400).json({ message: 'Counsellor ID is required' });

    const deleted = await User.findByIdAndDelete(id);
    if (!deleted)
      return res.status(404).json({ message: 'Counsellor not found' });

    return res.status(200).json({ message: 'Counsellor deleted successfully', id });
  } catch (error) {
    console.error('Error in deleteCounsellor:', error.message);
    res.status(500).json({ message: 'Server error while deleting counsellor' });
  }
};