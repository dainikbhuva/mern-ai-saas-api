import mongoose from 'mongoose'

export default async function connectDb() {
  const configuredUri = process.env.MONGO_URI
  const fallbackUri = 'mongodb://127.0.0.1:27017/mern-ai-saas'
  const mongoUri = configuredUri || fallbackUri

  if (!configuredUri) {
    console.warn('MONGO_URI is not set; falling back to local MongoDB at', mongoUri)
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
    })
    console.log('MongoDB connected:', mongoUri)
    return
  } catch (connectionError: any) {
    console.error('Failed to connect to MongoDB at', mongoUri)
    console.error(connectionError)
    const isAtlasSRVFailure =
      configuredUri &&
      (connectionError.code === 'ECONNREFUSED' || connectionError.message?.includes('querySrv'))

    if (isAtlasSRVFailure && configuredUri && mongoUri !== fallbackUri) {
      console.warn('Atlas DB connection failed, attempting local fallback:', fallbackUri)
      try {
        await mongoose.connect(fallbackUri, {
          serverSelectionTimeoutMS: 10000,
        })
        console.log('MongoDB local fallback connected:', fallbackUri)
        return
      } catch (localError) {
        console.error('Local fallback connection also failed', localError)
        throw localError
      }
    }

    throw connectionError
  }
}

