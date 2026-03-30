const hasRole = (roles) => {
  return (req, res, next) => {
    const userRole = req.admin?.role || req.owner?.role; // IDURAR puts the model name as key in req
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Droits insuffisants.',
      });
    }
    next();
  };
};

module.exports = { hasRole };
