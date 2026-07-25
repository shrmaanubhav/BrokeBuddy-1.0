import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log("Google verify callback reached");

      return done(null, {
        profile,
        accessToken,
        refreshToken,
      });
    }
  )
);

passport.use(
  "google",
  passport._strategy("google")
);

export default passport;