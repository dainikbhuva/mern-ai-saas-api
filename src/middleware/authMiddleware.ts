import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export interface AuthRequest extends Request {
  userId?: string
}

export const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: { code: 'NO_TOKEN', message: 'No authorization token provided' },
      })
    }

    const token = authHeader.substring(7)
    const secret = process.env.JWT_SECRET
    if (!secret) {
      const err = new Error('Missing JWT_SECRET')
      ;(err as any).statusCode = 500
      ;(err as any).expose = true
      throw err
    }

    const decoded = jwt.verify(token, secret) as { sub: string }
    req.userId = decoded.sub

    next()
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Token has expired' },
      })
    }

    if (err.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid token' },
      })
    }

    return res.status(err.statusCode || 500).json({
      success: false,
      error: {
        code: err.code || 'AUTH_ERROR',
        message: err.expose ? err.message : 'Authentication error',
      },
    })
  }
}
