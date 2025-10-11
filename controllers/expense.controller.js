export const getExpenses = async (req, res) => {
  const { email, date } = req.body;

  try {
    if (!email || !date) {
      return res.status(400).json({ message: "Fill Details" });
    }
    const data = { email: email, date: date };
    console.log(data);
    const resp = await fetch("http://localhost:8000/expense", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });
    const expense = await resp.json();
    console.log(expense);
    return res.status(200).json(expense);
  } catch (error) {
    return res.status(400).json({ message: "Error in fetching expenses" });
  }
};
