import Nickname from "../models/nickname.model.js";
import { buildAgentContext } from "./agent-context.service.js";

export const getUserNicknamesMap = async (email) => {
  const nicknamesArray = await Nickname.find({ userEmail: email });

  return nicknamesArray.reduce((acc, item) => {
    acc[item.upiId] = item.nickname;
    return acc;
  }, {});
};

export const upsertOrDeleteNickname = async (email, upiId, nickname) => {
  let updatedNickname = "";

  // 1. Database Logic
  if (!nickname || nickname.trim() === "") {
    await Nickname.findOneAndDelete({ userEmail: email, upiId: upiId });
  } else {
    updatedNickname = await Nickname.findOneAndUpdate(
      { userEmail: email, upiId: upiId },
      { nickname: nickname },
      { new: true, upsert: true }
    );
  }

  // 2. Formatting Logic
  const formatted = await buildAgentJson(email);

  // 3. External API Sync
  await fetch("http://localhost:8000/updateFormattedData", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(formatted),
  });

  return updatedNickname;
};