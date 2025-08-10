import mongoose from "mongoose";
async function ConnectDB(){
    try {
       await mongoose.connect(process.env.URL)
       console.log("Connected to DB")
    } catch (error) {
        console.log(error)
        console.log("Could not Connect to DB")
    }
}
export default ConnectDB