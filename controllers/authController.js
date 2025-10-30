import User from "../models/User.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import TempUser from "../models/tempUser.js";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const signup = async (req, res) => {
  const { email, password } = req.body;
  try {
    const existingTempUser = await TempUser.findOne({ email, verified: true });
    if (!existingTempUser)
      return res.status(400).json({ msg: "Email not verified" });

    const userExist = await User.findOne({ email });
    if (userExist) return res.status(400).json({ msg: "User already exists" });

    const saltRound = 5;
    const hashPass = await bcrypt.hash(password, saltRound);

    const newUser = new User({
      name: existingTempUser.name,
      email: existingTempUser.email,
      password: hashPass,
    });

    await newUser.save();
    res.status(201).json({ msg: "User created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: "Invalid Username" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid Password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Strict",
      maxAge: 60 * 60 * 1000,
    });

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "Strict",
  });
  res.json({ msg: "Logged out successfully" });
};

export const sendOTP = async (req, res) => {
  const { name, email } = req.body;

  try {
    if (!email.includes("@")) {
      return res.status(400).json({ msg: "Invalid email" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await TempUser.findOneAndUpdate(
      { email },
      { name, email, otp, expiresAt, verified: false },
      { upsert: true, new: true }
    );

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is: ${otp}`,
    });

    res.json({ msg: "OTP sent successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

export const verifyOTP = async (req, res) => {
  const { email, OTP } = req.body;

  try {
    const existingTempUser = await TempUser.findOne({ email });

    if (!existingTempUser)
      return res.status(400).json({ msg: "Email Not found" });

    if (existingTempUser.expiresAt < new Date())
      return res.status(400).json({ msg: "OTP expired" });

    if (String(existingTempUser.otp) !== String(OTP))
      return res.status(400).json({ msg: "Invalid OTP" });

    existingTempUser.verified = true;
    await existingTempUser.save();
    res.json({ msg: "OTP verified" });
  } catch (err) {
    console.error("SERVER ERROR:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

export const resetPass = async (req, res) => {
  const { email, newPass } = req.body;
  try {
    const existingTempUser = await TempUser.findOne({ email });

    if (!existingTempUser || !existingTempUser.verified) {
      return res.status(400).json("Invalid OTP");
    }

    const user = await User.findOne({ email });

    if (!user) return res.status(400).json("User not found");

    const saltRound = 10;
    const hashPass = await bcrypt.hash(newPass, saltRound);

    user.password = hashPass;
    await user.save();

    await TempUser.deleteOne({ email });

    return res.json({ msg: "Password reset successful" });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({
      msg: "Failed to reset password",
      error: err.message,
    });
  }
};
