import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { Request, Response, NextFunction } from 'express'
import User, { IUser } from '../models/User.js'

function signToken(user: IUser): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    const err = new Error('Missing JWT_SECRET')
    ;(err as any).statusCode = 500
    ;(err as any).expose = true
    throw err
  }

  return jwt.sign({ sub: user._id.toString() }, secret, { expiresIn: '7d' })
}

function normalizeEmail(email: unknown): string {
  return String(email || '').trim().toLowerCase()
}

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = normalizeEmail(req.body.email)
    const password = String(req.body.password || '')

    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_EMAIL', message: 'Enter a valid email.' } })
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ success: false, error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters.' } })
    }

    const existing = await User.findOne({ email })
    if (existing) {
      return res.status(409).json({ success: false, error: { code: 'EMAIL_IN_USE', message: 'Email already registered.' } })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await User.create({ email, passwordHash })

    const token = signToken(user)

    return res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          plan: user.plan,
          monthlyQuota: user.monthlyQuota,
          usedThisMonth: user.usedThisMonth,
        },
      },
    })
  } catch (e) {
    return next(e)
  }
}

export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const email = normalizeEmail(req.body.email)
    const password = String(req.body.password || '')

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, error: { code: 'MISSING_FIELDS', message: 'Email and password are required.' } })
    }

    const user = await User.findOne({ email })
    if (!user) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials.' } })
    }

    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      return res.status(401).json({ success: false, error: { code: 'INVALID_CREDENTIALS', message: 'Invalid credentials.' } })
    }

    const token = signToken(user)

    return res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id.toString(),
          email: user.email,
          plan: user.plan,
          monthlyQuota: user.monthlyQuota,
          usedThisMonth: user.usedThisMonth,
        },
      },
    })
  } catch (e) {
    return next(e)
  }
}
