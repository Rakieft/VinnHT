import jwt from "jsonwebtoken";

export const generateToken = (user) =>
  jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      roles: user.roles || [user.role],
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );
