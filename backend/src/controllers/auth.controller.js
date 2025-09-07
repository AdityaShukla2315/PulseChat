import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });

    if (user) return res.status(400).json({ message: "Email already exists" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      fullName,
      email,
      password: hashedPassword,
    });

    if (newUser) {
      // generate jwt token here
      generateToken(newUser._id, res);
      await newUser.save();

      res.status(201).json({
        _id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        profilePic: newUser.profilePic,
      });
    } else {
      res.status(400).json({ message: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error in signup controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    generateToken(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, email, profilePic } = req.body;
    const userId = req.user._id;

    // Log incoming data for debugging
    console.log('updateProfile request:', { userId, fullName, email, profilePicType: typeof profilePic, profilePicLength: profilePic?.length });

    // Find the user first
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user fields if provided
    const updateData = {};
    if (fullName) updateData.fullName = fullName;
    if (email && email !== user.email) {
      // Check if email is already taken by another user
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email is already taken" });
      }
      updateData.email = email;
    }

    // Handle profile picture upload if provided
    if (profilePic && profilePic !== user.profilePic) {
      try {
        // Only upload to Cloudinary if it's a new image (data URL)
        if (typeof profilePic === 'string' && profilePic.startsWith('data:image')) {
          // Validate base64 size (max 2MB)
          const base64Length = profilePic.length - profilePic.indexOf(',') - 1;
          const approxSize = (base64Length * 3) / 4; // bytes
          if (approxSize > 2 * 1024 * 1024) {
            return res.status(400).json({ message: "Image size should be less than 2MB" });
          }
          const uploadResponse = await cloudinary.uploader.upload(profilePic, {
            folder: "pulsechat/profiles",
            resource_type: "auto"
          });
          updateData.profilePic = uploadResponse.secure_url;
        } else if (typeof profilePic === 'string') {
          // If it's already a URL, just use it directly
          updateData.profilePic = profilePic;
        }
      } catch (uploadError) {
        console.error("Error uploading to Cloudinary:", uploadError);
        return res.status(500).json({ message: "Error uploading profile picture" });
      }
    }

    // Update the user with all changes
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select("-password"); // Don't return the password

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error in update profile:", error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({ message: "Email is already taken" });
    }
    
    res.status(500).json({ 
      message: error.message || "Internal server error" 
    });
  }
};

export const checkAuth = async (req, res) => {
  try {
    // Always fetch the latest user from the database
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.log("Error in checkAuth controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
