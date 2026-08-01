import prisma from "../lib/prisma.js";

export const getUserBankSenderEmail = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { bankSenderEmail: true, bankSenderVerified: true },
  });

  if (!user) {
    throw new Error("USER_NOT_FOUND");
  }

  return user;
};

export const updateUserBankSenderEmail = async (userId, bankSenderEmail) => {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { bankSenderEmail, bankSenderVerified: false },
      select: { bankSenderEmail: true, bankSenderVerified: true },
    });

    return user;
  } catch (err) {
    if (err.code === "P2025") {
      throw new Error("USER_NOT_FOUND");
    }
    throw err;
  }
};

export const verifyUserBankSenderEmail = async (userId) => {
  try {
    const user = await prisma.user.update({
      where: { id: userId },
      data: { bankSenderVerified: true },
      select: { bankSenderVerified: true },
    });

    return user.bankSenderVerified;
  } catch (err) {
    if (err.code === "P2025") {
      throw new Error("USER_NOT_FOUND");
    }
    throw err;
  }
};
