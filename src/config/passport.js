import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import env from "./env.js";
import User from "../models/User.js";

export const googleEnabled = Boolean(
  env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL,
);

if (googleEnabled) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          const emailVerified = profile.emails?.[0]?.verified !== false;

          // 1. Already linked by Google ID
          let user = await User.findOne({
            googleId: profile.id,
            deletedAt: null,
          });

          // 2. Link to an existing account with the same email
          if (!user && email) {
            user = await User.findOne({ email, deletedAt: null });
            if (user) {
              user.googleId = profile.id;
              if (emailVerified) user.emailVerified = true;
              await user.save();
            }
          }

          // 3. Create a new account
          if (!user) {
            user = await User.create({
              name: profile.displayName || email || "User",
              email,
              googleId: profile.id,
              emailVerified,
              consentAcceptedAt: new Date(),
            });
          }
          done(null, user);
        } catch (err) {
          done(err);
        }
      },
    ),
  );
}

export default passport;
