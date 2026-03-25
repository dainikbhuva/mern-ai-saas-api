import mongoose, { Document, Schema } from 'mongoose'

export interface IUser extends Document {
  email: string
  passwordHash: string
  plan: 'free' | 'pro'
  monthlyQuota: number
  usedThisMonth: number
}

const userSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    plan: { type: String, enum: ['free', 'pro'], default: 'free' },
    monthlyQuota: { type: Number, default: 5 },
    usedThisMonth: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export default mongoose.model<IUser>('User', userSchema)
