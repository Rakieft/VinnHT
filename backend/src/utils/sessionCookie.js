const isProduction = () => process.env.NODE_ENV === "production";

export const sessionCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction(),
  sameSite: isProduction() ? "strict" : "lax",
  maxAge: 24 * 60 * 60 * 1000,
  path: "/",
});

export const setSessionCookie = (res, token) => {
  res.cookie("vinnht_session", token, sessionCookieOptions());
};

export const clearSessionCookie = (res) => {
  res.clearCookie("vinnht_session", sessionCookieOptions());
};
