import prisma from "../lib/prisma.js";

export const getUserNicknamesMap = async (userId) => {
  const nicknamesArray = await prisma.nickname.findMany({
    where: {
      userId,
    },
  });

  return nicknamesArray.reduce((acc, item) => {
    acc[item.upiId] = item.nickname;
    return acc;
  }, {});
};

export const upsertOrDeleteNickname = async (
  userId,
  upiId,
  nickname
) => {
  if (!nickname || nickname.trim() === "") {
    await prisma.nickname.deleteMany({
      where: {
        userId,
        upiId,
      },
    });

    return null;
  }

  return await prisma.nickname.upsert({
    where: {
      userId_upiId: {
        userId,
        upiId,
      },
    },
    update: {
      nickname,
    },
    create: {
      userId,
      upiId,
      nickname,
    },
  });
};