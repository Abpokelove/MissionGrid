const requireCaptain = (req, res, next) => {
  if (req.user?.role !== 'Captain') {
    res.status(403);
    return next(new Error('Captain access required'));
  }

  return next();
};

module.exports = { requireCaptain };
