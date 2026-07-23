import prisma from "../lib/prisma.js";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export const getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return user;
};

export const updateUserName = async (userId, newName) => {
  try {
    const user = await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        name: newName.trim(),
      },
    });

    return user.name;
  } catch (err) {
    if (err.code === "P2025") {
      throw new Error("USER_NOT_FOUND");
    }
    throw err;
  }
};

export const updateUserPassword = async (
  userId,
  currentPassword,
  newPassword
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  const isMatch = await bcrypt.compare(
    currentPassword,
    user.passwordHash
  );

  if (!isMatch) {
    throw new Error("INCORRECT_PASSWORD");
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      passwordHash,
    },
  });
};

export const deleteUserAccount = async (userId) => {
  try {
    await prisma.user.delete({
      where: {
        id: userId,
      },
    });
  } catch (err) {
    if (err.code === "P2025") {
      throw new Error("USER_NOT_FOUND");
    }
    throw err;
  }
};