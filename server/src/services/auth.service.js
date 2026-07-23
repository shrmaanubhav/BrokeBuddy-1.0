import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const SALT_ROUNDS = 10;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const signupUser = async (email, password) => {
  const existingTempUser = await prisma.tempUser.findUnique({
    where: { email },
  });

  if (!existingTempUser || !existingTempUser.verified) {
    throw new Error("EMAIL_NOT_VERIFIED");
  }

  const userExist = await prisma.user.findUnique({
    where: { email },
  });

  if (userExist) throw new Error("USER_ALREADY_EXISTS");

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  return await prisma.user.create({
    data: {
      name: existingTempUser.name ?? "",
      email: existingTempUser.email,
      passwordHash,
    },
  });
};

export const loginUser = async (email, password) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) throw new Error("INVALID_USERNAME");

  const isMatch = await bcrypt.compare(password, user.passwordHash);

  if (!isMatch) throw new Error("INVALID_PASSWORD");

  const token = jwt.sign(
    {
      id: user.id,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    }
  );

  return { user, token };
};

export const generateAndSendOTP = async (name, email) => {
  if (!email.includes("@")) {
    throw new Error("INVALID_EMAIL");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  await prisma.tempUser.upsert({
    where: {
      email,
    },
    update: {
      name,
      otp,
      expiresAt,
      verified: false,
    },
    create: {
      name,
      email,
      otp,
      expiresAt,
      verified: false,
    },
  });

  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP is: ${otp}`,
  });
};

export const verifyUserOTP = async (email, OTP) => {
  const existingTempUser = await prisma.tempUser.findUnique({
    where: { email },
  });

  if (!existingTempUser) {
    throw new Error("EMAIL_NOT_FOUND");
  }

  if (existingTempUser.expiresAt < new Date()) {
    throw new Error("OTP_EXPIRED");
  }

  if (String(existingTempUser.otp) !== String(OTP)) {
    throw new Error("INVALID_OTP");
  }

  await prisma.tempUser.update({
    where: { email },
    data: {
      verified: true,
    },
  });
};

export const resetUserPassword = async (email, newPass) => {
  const existingTempUser = await prisma.tempUser.findUnique({
    where: { email },
  });

  if (!existingTempUser || !existingTempUser.verified) {
    throw new Error("INVALID_OTP_VERIFICATION");
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const passwordHash = await bcrypt.hash(newPass, SALT_ROUNDS);

  await prisma.user.update({
    where: {
      email,
    },
    data: {
      passwordHash,
    },
  });

  await prisma.tempUser.delete({
    where: {
      email,
    },
  });
};