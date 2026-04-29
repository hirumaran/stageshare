/**
 * requireAdmin middleware
 *
 * Must always be used AFTER authenticateToken in the middleware chain.
 * authenticateToken populates req.user — this middleware reads it.
 *
 * Fails closed: if req.user is undefined for any reason, denies access.
 */
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      error: 'Forbidden — admin access required'
    })
  }
  next()
}

module.exports = { requireAdmin }
