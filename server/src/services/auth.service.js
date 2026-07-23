import User from "../models/user.model.js";
import TempUser from "../models/temp-user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
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

export const signupUser = async (email, password) => {
  const existingTempUser = await TempUser.findOne({ email, verified: true });
  if (!existingTempUser) throw new Error("EMAIL_NOT_VERIFIED");

  const userExist = await User.findOne({ email });
  if (userExist) throw new Error("USER_ALREADY_EXISTS");

  const saltRound = 5;
  const hashPass = await bcrypt.hash(password, saltRound);

  const newUser = new User({
    name: existingTempUser.name,
    email: existingTempUser.email,
    password: hashPass,
  });

  return await newUser.save();
};

export const loginUser = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("INVALID_USERNAME");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("INVALID_PASSWORD");

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  return { user, token };
};

export const generateAndSendOTP = async (name, email) => {
  if (!email.includes("@")) throw new Error("INVALID_EMAIL");

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
};

export const verifyUserOTP = async (email, OTP) => {
  const existingTempUser = await TempUser.findOne({ email });
  if (!existingTempUser) throw new Error("EMAIL_NOT_FOUND");
  
  if (existingTempUser.expiresAt < new Date()) throw new Error("OTP_EXPIRED");
  if (String(existingTempUser.otp) !== String(OTP)) throw new Error("INVALID_OTP");

  existingTempUser.verified = true;
  await existingTempUser.save();
};

export const resetUserPassword = async (email, newPass) => {
  const existingTempUser = await TempUser.findOne({ email });
  if (!existingTempUser || !existingTempUser.verified) {
    throw new Error("INVALID_OTP_VERIFICATION");
  }

  const user = await User.findOne({ email });
  if (!user) throw new Error("USER_NOT_FOUND");

  const saltRound = 10; // Note: You used 5 in signup and 10 here in your original code
  const hashPass = await bcrypt.hash(newPass, saltRound);

  user.password = hashPass;
  await user.save();

  await TempUser.deleteOne({ email });
};