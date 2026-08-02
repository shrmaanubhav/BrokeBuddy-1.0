import "./src/config/env.js";
import prisma from "./src/lib/prisma.js";

try {
  console.log("Connecting...");
  await prisma.$connect();
  console.log("Connected!");

  console.log("Running query...");
  const user = await prisma.user.findFirst();

  console.log(user);

  await prisma.$disconnect();
  console.log("Done");
} catch (err) {
  console.error(err);
}