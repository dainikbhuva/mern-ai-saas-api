import { Router } from 'express'
import { generateGoogleAdsCopy, getGenerationHistory, getUserQuota } from '../controllers/aiController.js'
import { authMiddleware } from '../middleware/authMiddleware.js'

const router = Router()

router.use(authMiddleware)

router.post('/generate/ads', generateGoogleAdsCopy)
router.get('/history', getGenerationHistory)
router.get('/quota', getUserQuota)

export default router
