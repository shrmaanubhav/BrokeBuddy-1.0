import * as nicknameService from "../services/nickname.service.js";

export const getNicknames = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const nicknamesMap = await nicknameService.getUserNicknamesMap(email);
    res.json(nicknamesMap);
  } catch (error) {
    console.error("Error fetching nicknames:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const saveNickname = async (req, res) => {
  const { email, upiId, nickname } = req.body;
  
  try {
    if (!email || !upiId) {
      return res.status(400).json({ message: "Email and UPI ID are required" });
    }

    const updatedNickname = await nicknameService.upsertOrDeleteNickname(
      email, 
      upiId, 
      nickname
    );
    
    res.json(updatedNickname);
  } catch (error) {
    console.error("Error saving nickname:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};