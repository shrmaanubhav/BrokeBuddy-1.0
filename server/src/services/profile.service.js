import prisma from "../lib/prisma.js";

export const getUserProfile = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      picture: true,
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