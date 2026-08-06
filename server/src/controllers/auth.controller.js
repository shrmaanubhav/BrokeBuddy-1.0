import * as authService from "../services/auth.service.js";

export const googleCallback = async (req, res) => {
  try {
    const { profile, refreshToken } = req.user;

    const user = await authService.findOrCreateGoogleUser({
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      picture: profile.photos?.[0]?.value ?? null,
      refreshToken,
    });

    const token = authService.generateUserToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 60 * 60 * 1000,
    });

    return res.redirect(process.env.FRONTEND_URL);
  } catch (err) {
    console.error(err);

    return res.redirect(`${process.env.FRONTEND_URL}/login`);
  }
};

export const logout = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  });

  res.json({
    msg: "Logged out successfully",
  });
};
