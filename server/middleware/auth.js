const { verifyToken } = require('../../lib/auth-server')

function authenticateToken(req, res, next) {
  const token = req.cookies.token

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const verified = verifyToken(token)

  if (!verified) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  req.user = verified
  next()
}

module.exports = { authenticateToken }
