import { FastifyRequest, FastifyReply } from 'fastify';
import { userService } from '../../../services/UserService';
import { oauthService } from '../../../services/OAuthService';
import { AuthenticatedRequest } from '../../../middleware/auth';
import {
 LoginDto,
 RegisterDto,
 RefreshTokenDto,
 OAuthCallbackDto,
 UpdateProfileDto,
} from '../dtos';

export class AuthController {
 static async login(request: FastifyRequest, reply: FastifyReply) {
  try {
   const { email, password } = request.body as LoginDto;
   // Since UserService doesn't have login method for password-based auth (OAuth only), we'll return an error
   return reply.status(400).send({
    success: false,
    error: 'Password-based login is not supported. Please use OAuth.',
   });
  } catch (error) {
   request.log.error('Login error:', error);
   return reply.status(401).send({
    success: false,
    error: 'Invalid credentials',
   });
  }
 }

 static async register(request: FastifyRequest, reply: FastifyReply) {
  try {
   const userData = request.body as RegisterDto;
   // Since this is OAuth-only, we need to provide the required OAuth fields
   const createUserData = {
    ...userData,
    role: 'USER' as const,
    oauthProvider: 'GOOGLE' as const, // Default to Google for now
    oauthId: `temp_${Date.now()}`, // Temporary ID since this is OAuth-only
   };
   const result = await userService.createUser(createUserData);
   return reply.send({
    success: true,
    data: result,
   });
  } catch (error) {
   request.log.error('Registration error:', error);
   return reply.status(400).send({
    success: false,
    error: error instanceof Error ? error.message : 'Registration failed',
   });
  }
 }

 static async refreshToken(request: FastifyRequest, reply: FastifyReply) {
  try {
   const { refreshToken } = request.body as RefreshTokenDto;
   const result = await userService.refreshToken(refreshToken);
   if (!result) {
    return reply.status(401).send({
     success: false,
     error: 'Invalid refresh token',
    });
   }
   return reply.send({
    success: true,
    data: result,
   });
  } catch (error) {
   request.log.error('Token refresh error:', error);
   return reply.status(401).send({
    success: false,
    error: 'Invalid refresh token',
   });
  }
 }

 static async logout(request: FastifyRequest, reply: FastifyReply) {
  try {
   const token = request.headers.authorization?.replace('Bearer ', '');
   if (token) {
    await userService.logout(token);
   }
   return reply.send({
    success: true,
    message: 'Logged out successfully',
   });
  } catch (error) {
   request.log.error('Logout error:', error);
   return reply.send({
    success: true,
    message: 'Logged out successfully',
   });
  }
 }

 static async getMe(request: AuthenticatedRequest, reply: FastifyReply) {
  try {
   const authUser = request.user!;
   // Fetch full user profile from DB
   const dbUser = await userService.getUserById(authUser.id);
   if (!dbUser) {
    return reply.status(404).send({ success: false, error: 'User not found' });
   }
   return reply.send({
    success: true,
    user: {
     id: dbUser.id,
     email: dbUser.email,
     username: dbUser.username,
     role: dbUser.role,
     firstName: dbUser.firstName,
     lastName: dbUser.lastName,
     avatar: dbUser.avatar ?? undefined,
     isActive: dbUser.isActive,
     emailVerified: dbUser.emailVerified,
     oauthProvider: dbUser.oauthProvider ?? undefined,
     createdAt: dbUser.createdAt,
     updatedAt: dbUser.updatedAt,
     lastLoginAt: dbUser.lastLoginAt ?? undefined,
    },
   });
  } catch (error) {
   request.log.error('Get me error:', error);
   return reply.status(500).send({
    success: false,
    error: 'Failed to get user data',
   });
  }
 }

 static async updateProfile(
  request: AuthenticatedRequest,
  reply: FastifyReply
 ) {
  try {
   const user = request.user!;
   const updateData = request.body as UpdateProfileDto;
   const result = await userService.updateUser(user.id, updateData);
   if (!result) {
    return reply.status(400).send({
     success: false,
     error: 'Failed to update profile',
    });
   }
   return reply.send({
    success: true,
    user: result,
   });
  } catch (error) {
   request.log.error('Update profile error:', error);
   return reply.status(400).send({
    success: false,
    error: error instanceof Error ? error.message : 'Failed to update profile',
   });
  }
 }

 static async googleOAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
   const googleAuthUrl =
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(`${process.env.API_URL || 'http://localhost:3001'}/api/auth/google/callback`)}&` +
    `response_type=code&` +
    `scope=email profile&` +
    `access_type=offline&` +
    `prompt=consent`;
   return reply.redirect(googleAuthUrl);
  } catch (error) {
   request.log.error('Google OAuth initiation error:', error);
   throw new Error('Failed to initiate Google OAuth');
  }
 }

 static async googleCallback(request: FastifyRequest, reply: FastifyReply) {
  try {
   const { code } = request.query as OAuthCallbackDto;
   if (!code) {
    throw new Error('Authorization code not provided');
   }

   const loginResponse = await oauthService.handleGoogleOAuth(code);
   const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

   return reply.redirect(
    `${frontendUrl}/auth/login?` +
     `access_token=${loginResponse.token}&` +
     `refresh_token=${loginResponse.refreshToken}`
   );
  } catch (error) {
   request.log.error('Google OAuth callback error:', error);
   const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
   return reply.redirect(
    `${frontendUrl}/auth/login?error=${encodeURIComponent(error instanceof Error ? error.message : 'OAuth error')}`
   );
  }
 }

 static async githubOAuth(request: FastifyRequest, reply: FastifyReply) {
  try {
   const githubAuthUrl =
    `https://github.com/login/oauth/authorize?` +
    `client_id=${process.env.GITHUB_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(`${process.env.API_URL || 'http://localhost:3001'}/api/auth/github/callback`)}&` +
    `scope=user:email`;
   return reply.redirect(githubAuthUrl);
  } catch (error) {
   request.log.error('GitHub OAuth initiation error:', error);
   throw new Error('Failed to initiate GitHub OAuth');
  }
 }

 static async githubCallback(request: FastifyRequest, reply: FastifyReply) {
  try {
   const { code } = request.query as OAuthCallbackDto;
   if (!code) {
    throw new Error('Authorization code not provided');
   }

   const loginResponse = await oauthService.handleGitHubOAuth(code);
   const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

   return reply.redirect(
    `${frontendUrl}/auth/login?` +
     `access_token=${loginResponse.token}&` +
     `refresh_token=${loginResponse.refreshToken}`
   );
  } catch (error) {
   request.log.error('GitHub OAuth callback error:', error);
   const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
   return reply.redirect(
    `${frontendUrl}/auth/login?error=${encodeURIComponent(error instanceof Error ? error.message : 'OAuth error')}`
   );
  }
 }
}
