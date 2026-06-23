export const authorize = (...roles) => (req, res, next) => {
  const userRoles = req.user.roles || [req.user.role].filter(Boolean);
  const allowed =
    roles.some((role) => userRoles.includes(role)) || userRoles.includes("admin");

  if (!req.user || !allowed) {
    return res.status(403).json({ message: "Vous n’avez pas accès à cette ressource." });
  }

  next();
};
