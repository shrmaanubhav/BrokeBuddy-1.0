import prisma from "../lib/prisma.js";
import { buildAgentContext } from "./agent-context.service.js";
import * as parserService from "./parser.service.js";

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
  let updatedNickname = null;

  if (!nickname || nickname.trim() === "") {
    await prisma.nickname.deleteMany({
      where: {
        userId,
        upiId,
      },
    });
  } else {
    updatedNickname = await prisma.nickname.upsert({
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
  }

  // Keep LLM context in sync
  const formatted = await buildAgentContext(userId);

  await parserService.updateAgentData(formatted);

  return updatedNickname;
};