const requireCaptain = (req, res, next) => {
  const isProjectManager = req.user?.role === 'Captain' || req.user?.role === 'Project Manager' || req.user?.role === 'ProjectManager';
  if (!isProjectManager) {
    res.status(403);
    return next(new Error('Project Manager access required'));
  }

  return next();
};

module.exports = { requireCaptain };
