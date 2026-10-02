import * as chatService from "../services/chat.service.js";

export const chat = async (req, res) => {
  try {
    const { query, context } = req.body;

    if (!query?.trim()) {
      return res.status(400).json({
        message: "Query is required",
      });
    }

    const response = await chatService.chat(
      req.user.id,
      query.trim(),
      context
    );

    return res.json(response);
  } catch (error) {
    console.error("Chat Error:", error);

    return res.status(500).json({
      message: "Failed to process chat request",
    });
  }
};