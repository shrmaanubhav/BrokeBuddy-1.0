import prisma from "../lib/prisma.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const generateJwt = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    {
      expiresIn: "1h",
    }
  );
};

export const findOrCreateGoogleUser = async ({
  googleId,
  email,
  name,
  picture,
  refreshToken,
}) => {
  let user = null;

  if (googleId) {
    user = await prisma.user.findUnique({
      where: { googleId },
    });
  }

  if (!user) {
    user = await prisma.user.findUnique({
      where: { email },
    });
  }

  if (!user) {
    user = await prisma.user.create({
      data: {
        name,
        email,
        googleId,
        picture,
        googleRefreshToken: refreshToken,
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        googleId,
        picture,
        ...(refreshToken && {
          googleRefreshToken: refreshToken,
        }),
      },
    });
  }

  return user;
};

export const generateUserToken = (user) => {
  return generateJwt(user.id);
};