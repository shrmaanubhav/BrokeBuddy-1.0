import prisma from "../lib/prisma.js";
import { buildAgentContext } from "./agent-context.service.js";

export const getUserNicknamesMap = async (email) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return {};
  }

  const nicknamesArray = await prisma.nickname.findMany({
    where: {
      userId: user.id,
    },
  });

  return nicknamesArray.reduce((acc, item) => {
    acc[item.upiId] = item.nickname;
    return acc;
  }, {});
};

export const upsertOrDeleteNickname = async (email, upiId, nickname) => {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error("User not found");
  }

  let updatedNickname = null;

  if (!nickname || nickname.trim() === "") {
    await prisma.nickname.deleteMany({
      where: {
        userId: user.id,
        upiId,
      },
    });
  } else {
    updatedNickname = await prisma.nickname.upsert({
      where: {
        userId_upiId: {
          userId: user.id,
          upiId,
        },
      },
      update: {
        nickname,
      },
      create: {
        userId: user.id,
        upiId,
        nickname,
      },
    });
  }

  // Keep your existing LLM sync
  const formatted = await buildAgentContext(email);

  await fetch("http://localhost:8000/updateFormattedData", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(formatted),
  });

  return updatedNickname;
};