import mongoose, { Document, Schema } from 'mongoose'

export interface IGeneration extends Document {
  userId: mongoose.Types.ObjectId
  type: 'seo' | 'ads' | 'social_media' | 'design_brief'
  input: Record<string, any>
  output: string
  provider: 'gemini' | 'openai'
  tokensUsed: number
  createdAt: Date
}

const generationSchema = new Schema<IGeneration>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['seo', 'ads', 'social_media', 'design_brief'],
      required: true,
    },
    input: { type: Schema.Types.Mixed, required: true },
    output: { type: String, required: true },
    provider: {
      type: String,
      enum: ['gemini', 'openai'],
      required: true,
    },
    tokensUsed: { type: Number, default: 0 },
  },
  { timestamps: true },
)

export default mongoose.model<IGeneration>('Generation', generationSchema)
