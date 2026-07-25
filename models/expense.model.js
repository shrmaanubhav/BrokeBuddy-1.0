import mongoose from "mongoose";

const { Schema, model } = mongoose;

const ExpenseSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },

    category: {
      type: String,
      enum: ["dining", "travel", "shopping", "bills", "subscriptions", "other"],
      default: "other",
    },
    merchant: { type: String },
    date: { type: Date, default: Date.now },
    notes: { type: String },
  },
  { timestamps: true }
);

export default model("Expense", ExpenseSchema);
