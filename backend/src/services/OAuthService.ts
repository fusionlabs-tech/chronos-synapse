import { UserService } from './UserService';
import { EmailService } from './EmailService';
import { logger } from '../utils/logger';

export class OAuthService {
 private userService: UserService;
 private emailService: EmailService;

 constructor() {
  this.userService = new UserService();
  this.emailService = new EmailService();
 }

 async handleGoogleOAuth(code: string): Promise<any> {
  try {
   // Exchange code for tokens
   const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
     'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
     client_id: process.env.GOOGLE_CLIENT_ID || '',
     client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
     code,
     grant_type: 'authorization_code',
     redirect_uri: `${process.env.API_URL || 'http://localhost:3001'}/api/auth/google/callback`,
    }),
   });

   const tokenData = (await tokenResponse.json()) as any;

   if (!tokenResponse.ok) {
    throw new Error(`Token exchange failed: ${tokenData.error}`);
   }

   // Get user info from Google
   const userResponse = await fetch(
    'https://www.googleapis.com/oauth2/v2/userinfo',
    {
     headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
     },
    }
   );

   const userData = (await userResponse.json()) as any;

   if (!userResponse.ok) {
    throw new Error('Failed to fetch user data from Google');
   }

   return await this.processOAuthUser(userData, 'GOOGLE');
  } catch (error) {
   logger.error('Google OAuth error:', error);
   throw error;
  }
 }

 async handleGitHubOAuth(code: string): Promise<any> {
  try {
   // Exchange code for tokens
   const tokenResponse = await fetch(
    'https://github.com/login/oauth/access_token',
    {
     method: 'POST',
     headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
     },
     body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
     }),
    }
   );

   const tokenData = (await tokenResponse.json()) as any;

   if (!tokenResponse.ok || tokenData.error) {
    throw new Error(
     `Token exchange failed: ${tokenData.error_description || tokenData.error}`
    );
   }

   // Get user info from GitHub
   const userResponse = await fetch('https://api.github.com/user', {
    headers: {
     Authorization: `Bearer ${tokenData.access_token}`,
     Accept: 'application/vnd.github.v3+json',
    },
   });

   const userData = (await userResponse.json()) as any;

   if (!userResponse.ok) {
    throw new Error('Failed to fetch user data from GitHub');
   }

   // Get user email from GitHub
   const emailResponse = await fetch('https://api.github.com/user/emails', {
    headers: {
     Authorization: `Bearer ${tokenData.access_token}`,
     Accept: 'application/vnd.github.v3+json',
    },
   });

   const emails = (await emailResponse.json()) as any[];
   const primaryEmail =
    emails.find((email: any) => email.primary)?.email || userData.email;

   if (!primaryEmail) {
    throw new Error('No email found for GitHub user');
   }

   // Combine user data with email
   const combinedUserData = {
    ...userData,
    email: primaryEmail,
   };

   return await this.processOAuthUser(combinedUserData, 'GITHUB');
  } catch (error) {
   logger.error('GitHub OAuth error:', error);
   throw error;
  }
 }

 private async processOAuthUser(
  userData: any,
  provider: 'GOOGLE' | 'GITHUB'
 ): Promise<any> {
  const email = userData.email;
  const name = userData.name || userData.displayName || '';
  const avatar = userData.picture || userData.avatar_url;

  if (!email) {
   throw new Error(`Email not provided by ${provider}`);
  }

  // Check if user exists
  let user = await this.userService.getUserByEmail(email);

  if (!user) {
   // Create new user
   const userCreateData = {
    email,
    username: userData.login || email.split('@')[0],
    firstName: name.split(' ')[0] || '',
    lastName: name.split(' ').slice(1).join(' ') || '',
    oauthProvider: provider,
    oauthId: userData.id?.toString() || userData.id,
    avatar,
    role: 'USER' as const,
   };

   user = await this.userService.createUser(userCreateData);

   // Send welcome email
   try {
    await this.emailService.sendWelcomeEmail(email, name);
    logger.info(`Welcome email sent to ${email}`);
   } catch (emailError) {
    logger.error('Failed to send welcome email:', emailError);
   }
  } else {
   // Update existing user's OAuth info
   await this.userService.updateUser(user.id, {
    oauthProvider: provider,
    oauthId: userData.id?.toString() || userData.id,
    avatar,
    lastLoginAt: new Date().toISOString(),
   });
  }

  // Generate JWT tokens
  const loginResponse = await this.userService.oauthLogin(user);

  return {
   ...loginResponse,
  };
 }
}

export const oauthService = new OAuthService();
