import User from "../models/User.js";
import Nickname from "../models/Nickname.js";
import manualTransaction from "../models/manualTransaction.js";
import onlineTransaction from "../models/onlineTransaction.js";
import bcrypt from "bcrypt";
import { buildAgentJson } from "../utils/buildAgentJson.js";
export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Get Profile Error:", error);
    res
      .status(500)
      .json({ msg: "Server error fetching profile.", error: error.message });
  }
};

export const changeName = async (req, res) => {
  const { newName } = req.body;
  const userId = req.user._id;
  if (!newName || newName.trim() === "") {
    return res.status(400).json({ msg: "New name cannot be empty." });
  }
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

    user.name = newName.trim();
    await user.save();
    res
      .status(200)
      .json({ msg: "Name updated successfully.", name: user.name });
  } catch (error) {
    console.error("Change Name Error:", error);
    res
      .status(500)
      .json({ msg: "Server error updating name.", error: error.message });
  }
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user._id;

  if (!currentPassword || !newPassword) {
    return res
      .status(400)
      .json({ msg: "Please provide both current and new passwords." });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ msg: "User not found." });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: "Incorrect current password." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedNewPassword;
    await user.save();

    res.status(200).json({ msg: "Password updated successfully." });
  } catch (error) {
    console.error("Change Password Error:", error);
    res
      .status(500)
      .json({ msg: "Server error updating password.", error: error.message });
  }
};

export const deleteAccount = async (req, res) => {
  const userId = req.user._id;
  const userEmail = req.user.email;

  try {
    const deletedUser = await User.findByIdAndDelete(userId);
    if (!deletedUser) {
      return res.status(404).json({ msg: "User not found." });
    }

    await Nickname.deleteMany({ userEmail: userEmail });
    await manualTransaction.deleteMany({ userEmail: userEmail });

    res
      .status(200)
      .json({ msg: "Account and associated data deleted successfully." });
  } catch (error) {
    console.error("Delete Account Error:", error);
    res
      .status(500)
      .json({ msg: "Server error deleting account.", error: error.message });
  }
};

export const updateUserData=async(req,res)=>{
 const {email} = req.body
 const date = new Date();

  
  date.setDate(date.getDate() - 60);

  
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();

  const date_2mon = `${day}-${month}-${year}`;
  console.log(date_2mon); 

  try {
    const resp = await fetch(`http://localhost:8000/expense`,{
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body:JSON.stringify({email,date:date_2mon})
    })
    const data=await resp.json();
    const transactions = data.Transactions || [];

    const formattedTxns=transactions.map((txn)=>({
      userEmail:email,
      UPI_ID:txn.UPI_ID,
      nickname:txn.nicknameId,
      COST:txn.COST,
      DEBITED:txn.DEBITED,
      date:txn.date
    }))

    const bulkOps=formattedTxns.map((txn)=>({
      updateOne:{
        filter:{userEmail:txn.userEmail,UPI_ID:txn.UPI_ID,COST:txn.COST,date:txn.date},
        update:{$setOnInsert:{
          userEmail: email,
          UPI_ID: txn.UPI_ID,
          COST: txn.COST,
          DEBITED: txn.DEBITED,
          date: txn.date,
        }},
        upsert:true
      }
    }))

    if (bulkOps.length>0){
      await onlineTransaction.bulkWrite(bulkOps);
    }

    const formatted= await buildAgentJson(email)
    
    await fetch("http://localhost:8000/updateData", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({transactions: formatted }),
    });

    res.status(200).json({message: "Synced and formatted successfully"});
  } catch (error) {
    res.status(500).json({msg:"Error updating data",error:error.message});
  }
}