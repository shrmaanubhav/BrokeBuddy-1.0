import axios from "axios";

const parserApi = axios.create({
  baseURL: process.env.PYTHON_API_URL,
  timeout: 30000,
});

export const parseExpenses = async (payload) => {
  try {
    const { data } = await parserApi.post("/expense", payload);
    console.log("Python response:", data);
    return data.Transactions ?? data.transactions ?? [];
  } catch (err) {
    throw new Error("PARSER_UNAVAILABLE");
  }
};

export const chat = async (payload) => {
  try {
    const { data } = await parserApi.post("/chat", payload);
    return data;
  } catch (err) {
    throw new Error("PARSER_UNAVAILABLE");
  }
};
