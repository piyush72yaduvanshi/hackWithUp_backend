import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import User from "../model/user.js";
import cookieParser from "cookie-parser";
import { GoogleGenAI } from "@google/genai";
import dotevn from "dotenv";

dotevn.config();

export const register = async (req, res) => {
  try {
    const { name, location, land_size, main_crop, phone, email, password } =
      req.body;

    if (
      !name ||
      !location ||
      !land_size ||
      !main_crop ||
      !phone ||
      !email ||
      !password
    ) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      location,
      land_size,
      main_crop,
      phone,
      email,
      password: hashedPassword,
    });

    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        _id: user._id,
        name: user.name,
        location: user.location,
        land_size: user.land_size,
        main_crop: user.main_crop,
        phone: user.phone,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout Error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const profile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        location: user.location,
        land_size: user.land_size,
        main_crop: user.main_crop,
        phone: user.phone,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Profile Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const { name, location, land_size, main_crop, phone, email } = req.body;

    if (name) user.name = name;
    if (location) user.location = location;
    if (land_size) user.land_size = land_size;
    if (main_crop) user.main_crop = main_crop;
    if (phone) user.phone = phone;
    if (email) user.email = email;

    const updatedUser = await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        location: updatedUser.location,
        land_size: updatedUser.land_size,
        main_crop: updatedUser.main_crop,
        phone: updatedUser.phone,
        email: updatedUser.email,
      },
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const priceThroughAi = async (req, res) => {
    const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY ,
});
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const city = user.location;
    const crop = user.main_crop;

    if (!city || !crop) {
      return res.status(400).json({
        message: "Location or crop information missing in user profile",
      });
    }

    const groundingTool = {
      googleSearch: {},
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${crop} ${city}`,
      config: {
        tools: [groundingTool],
        systemInstruction: `You are an agriculture mandi price assistant.
User will give a district name and crop name.
Your job is to return ONLY the mandi price for that crop in that district (India).

Output format must be short, clear and structured like this exact format:

Crop: <crop name>
District: <district name>
Price: ₹<price per quintal>
No extra explanation, no notes, no intro, no emoji.

If price is not available, then say:
Price not available`,
      },
    });

    const priceInfo = response.text;

    res.status(200).json({
      success: true,
      data: {
        crop,
        city,
        priceInfo,
      },
    });
  } catch (error) {
    console.error("Error fetching mandi price:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};
