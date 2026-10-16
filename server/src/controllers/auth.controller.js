import * as authService from "../services/auth.service.js";

export const createGoogleCallback = (authServiceApi = authService) => async (req, res) => {
  try {
    const { profile, refreshToken } = req.user;

    const user = await authServiceApi.findOrCreateGoogleUser({
      googleId: profile.id,
      email: profile.emails[0].value,
      name: profile.displayName,
      picture: profile.photos?.[0]?.value ?? null,
      refreshToken,
    });

    const token = authServiceApi.generateUserToken(user);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      maxAge: 60 * 60 * 1000,
    });

    return res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (err) {
    console.error(err);

    return res.redirect(`${process.env.FRONTEND_URL}/login`);
  }
};

export const googleCallback = createGoogleCallback();

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
