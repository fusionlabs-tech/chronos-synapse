import { FastifyInstance } from 'fastify';
import { AuthController } from '../controllers/AuthController';
import { requireAuth, AuthenticatedRequest } from '../../../middleware/auth';
import { loginRateLimit, registrationRateLimit } from '../../../middleware/rateLimit';

export default async function authRoutes(fastify: FastifyInstance) {
 // Login route
 fastify.post('/login', {
  preHandler: loginRateLimit,
 }, AuthController.login);

 // Register route
 fastify.post('/register', {
  preHandler: registrationRateLimit,
 }, AuthController.register);

 // Refresh token route
 fastify.post('/refresh', AuthController.refreshToken);

 // Logout route
 fastify.post('/logout', AuthController.logout);

 // Get current user
 fastify.get('/me', {
  preHandler: requireAuth,
 }, AuthController.getMe);

 // Update profile
 fastify.put('/profile', {
  preHandler: requireAuth,
 }, AuthController.updateProfile);

 // OAuth routes
 fastify.get('/google', AuthController.googleOAuth);

 fastify.get('/google/callback', AuthController.googleCallback);

 fastify.get('/github', AuthController.githubOAuth);

 fastify.get('/github/callback', AuthController.githubCallback);
}
