import { Router } from 'express'
import { 
  getAuthUrl, 
  handleCallback, 
  linkProvider, 
  unlinkProvider 
} from '../controllers/oauth.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

// Public routes
router.get('/sso/:provider/url', getAuthUrl)
router.get('/sso/:provider/callback', handleCallback) // Google uses GET for callbacks
router.post('/sso/:provider/callback', handleCallback) // Keep POST for compatibility

// Protected routes (for linking/unlinking providers)
router.post('/sso/:provider/link', authenticate, linkProvider)
router.delete('/sso/:provider/unlink', authenticate, unlinkProvider)

export default router