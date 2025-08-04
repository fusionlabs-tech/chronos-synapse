import { User, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';
import { emailService } from './EmailService';
import {
 CreateUserRequest,
 UpdateUserRequest,
 LoginRequest,
 LoginResponse,
 AuthUser,
} from '../types/user';
import prisma from '../lib/prisma';

export class UserService {
 private jwtSecret: string;

 constructor() {
  this.jwtSecret =
   process.env.JWT_SECRET || 'your-secret-key-change-in-production';
 }

 async createUser(userData: CreateUserRequest): Promise<User> {
  try {
   // Check if user already exists
   const existingUser = await prisma.user.findFirst({
    where: {
     OR: [
      { email: userData.email.toLowerCase() },
      { username: userData.username },
     ],
    },
   });

   if (existingUser) {
    if (existingUser.email === userData.email.toLowerCase()) {
     throw new Error('User with this email already exists');
    } else {
     throw new Error('Username already taken');
    }
   }

   // Hash password
   const saltRounds = 12;
   const hashedPassword = await bcrypt.hash(userData.password, saltRounds);

   // Create user
   const user = await prisma.user.create({
    data: {
     email: userData.email.toLowerCase(),
     username: userData.username,
     firstName: userData.firstName,
     lastName: userData.lastName,
     password: hashedPassword,
     role: userData.role || Role.USER,
     isActive: true,
    },
   });

   logger.info(`User created: ${user.email} (${user.id})`);

   // Send welcome email asynchronously (don't block response)
   const userName = `${user.firstName} ${user.lastName}`;
   emailService
    .sendWelcomeEmail(user.email, userName)
    .then(() => {
     logger.info(`Welcome email sent to: ${user.email}`);
    })
    .catch((error) => {
     logger.error('Failed to send welcome email:', error);
     // Don't fail user creation if email fails
    });

   return user;
  } catch (error) {
   logger.error('Failed to create user:', error);
   throw error;
  }
 }

 async getUserById(userId: string): Promise<User | null> {
  try {
   const user = await prisma.user.findUnique({
    where: { id: userId },
   });

   return user;
  } catch (error) {
   logger.error('Failed to get user by ID:', error);
   return null;
  }
 }

 async getUserByEmail(email: string): Promise<User | null> {
  try {
   const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
   });

   return user;
  } catch (error) {
   logger.error('Failed to get user by email:', error);
   return null;
  }
 }

 async getUserByUsername(username: string): Promise<User | null> {
  try {
   const user = await prisma.user.findUnique({
    where: { username },
   });

   return user;
  } catch (error) {
   logger.error('Failed to get user by username:', error);
   return null;
  }
 }

 async updateUser(
  userId: string,
  updates: UpdateUserRequest
 ): Promise<User | null> {
  try {
   // Check if email is being updated and if it's already taken
   if (updates.email) {
    const existingUser = await prisma.user.findFirst({
     where: {
      email: updates.email.toLowerCase(),
      NOT: { id: userId },
     },
    });
    if (existingUser) {
     throw new Error('Email already taken');
    }
   }

   // Check if username is being updated and if it's already taken
   if (updates.username) {
    const existingUser = await prisma.user.findFirst({
     where: {
      username: updates.username,
      NOT: { id: userId },
     },
    });
    if (existingUser) {
     throw new Error('Username already taken');
    }
   }

   // Update user
   const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
     ...updates,
     email: updates.email?.toLowerCase(),
     updatedAt: new Date(),
    },
   });

   logger.info(`User updated: ${updatedUser.email} (${userId})`);
   return updatedUser;
  } catch (error) {
   logger.error('Failed to update user:', error);
   throw error;
  }
 }

 async deleteUser(userId: string): Promise<boolean> {
  try {
   await prisma.user.delete({
    where: { id: userId },
   });

   logger.info(`User deleted: ${userId}`);
   return true;
  } catch (error) {
   logger.error('Failed to delete user:', error);
   return false;
  }
 }

 async getAllUsers(): Promise<User[]> {
  try {
   const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
   });

   return users;
  } catch (error) {
   logger.error('Failed to get all users:', error);
   return [];
  }
 }

 async login(loginData: LoginRequest): Promise<LoginResponse | null> {
  try {
   const user = await prisma.user.findUnique({
    where: { email: loginData.email.toLowerCase() },
   });

   if (!user || !user.isActive) {
    return null;
   }

   // Verify password
   const isValidPassword = await bcrypt.compare(
    loginData.password,
    user.password
   );
   if (!isValidPassword) {
    return null;
   }

   // Update last login
   await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
   });

   // Generate JWT token
   const token = jwt.sign(
    {
     id: user.id,
     email: user.email,
     username: user.username,
     role: user.role,
    } as AuthUser,
    this.jwtSecret,
    { expiresIn: '24h' }
   );

   // Create session record
   await prisma.userSession.create({
    data: {
     userId: user.id,
     token: token, // In production, you might want to hash this
     expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
     userAgent: 'API', // You can get this from request headers
     ipAddress: '127.0.0.1', // You can get this from request
    },
   });

   logger.info(`User logged in: ${user.email} (${user.id})`);
   return {
    user,
    token,
    expiresIn: 24 * 60 * 60, // 24 hours in seconds
   };
  } catch (error) {
   logger.error('Failed to login user:', error);
   return null;
  }
 }

 async verifyToken(token: string): Promise<AuthUser | null> {
  try {
   const decoded = jwt.verify(token, this.jwtSecret) as AuthUser;

   // Check if session exists and is active
   const session = await prisma.userSession.findFirst({
    where: {
     token: token,
     isActive: true,
     expiresAt: { gt: new Date() },
    },
   });

   if (!session) {
    return null;
   }

   // Verify user still exists and is active
   const user = await prisma.user.findUnique({
    where: { id: decoded.id },
   });

   if (!user || !user.isActive) {
    return null;
   }

   return decoded;
  } catch (error) {
   logger.error('Failed to verify token:', error);
   return null;
  }
 }

 async logout(token: string): Promise<boolean> {
  try {
   await prisma.userSession.updateMany({
    where: { token: token },
    data: { isActive: false },
   });

   return true;
  } catch (error) {
   logger.error('Failed to logout user:', error);
   return false;
  }
 }

 async changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string
 ): Promise<boolean> {
  try {
   const user = await prisma.user.findUnique({
    where: { id: userId },
   });

   if (!user) {
    return false;
   }

   // Verify current password
   const isValidPassword = await bcrypt.compare(currentPassword, user.password);
   if (!isValidPassword) {
    return false;
   }

   // Hash new password
   const saltRounds = 12;
   const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

   // Update password
   await prisma.user.update({
    where: { id: userId },
    data: {
     password: hashedPassword,
     updatedAt: new Date(),
    },
   });

   logger.info(`Password changed for user: ${userId}`);
   return true;
  } catch (error) {
   logger.error('Failed to change password:', error);
   return false;
  }
 }

 async createDefaultAdmin(): Promise<User | null> {
  try {
   const adminEmail = process.env.ADMIN_EMAIL || 'admin@chronos-synapse.com';
   const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

   const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
   });

   if (existingAdmin) {
    logger.info('Default admin already exists');
    return existingAdmin;
   }

   const admin = await this.createUser({
    email: adminEmail,
    username: 'admin',
    firstName: 'System',
    lastName: 'Administrator',
    password: adminPassword,
    role: Role.ADMIN,
   });

   logger.info('Default admin created successfully');
   return admin;
  } catch (error) {
   logger.error('Failed to create default admin:', error);
   return null;
  }
 }

 // API Key Management
 async createApiKey(
  userId: string,
  name: string,
  permissions: string[] = []
 ): Promise<{ id: string; key: string }> {
  try {
   // Generate API key
   const apiKey = `cs_${this.generateRandomString(32)}`;
   const hashedKey = await bcrypt.hash(apiKey, 10);

   const apiKeyRecord = await prisma.apiKey.create({
    data: {
     name,
     key: hashedKey,
     userId,
     permissions,
     isActive: true,
    },
   });

   logger.info(`API key created for user: ${userId}`);
   return { id: apiKeyRecord.id, key: apiKey };
  } catch (error) {
   logger.error('Failed to create API key:', error);
   throw error;
  }
 }

 async verifyApiKey(apiKey: string): Promise<AuthUser | null> {
  try {
   const apiKeyRecords = await prisma.apiKey.findMany({
    where: { isActive: true },
    include: { user: true },
   });

   for (const record of apiKeyRecords) {
    const isValid = await bcrypt.compare(apiKey, record.key);
    if (isValid) {
     // Update last used
     await prisma.apiKey.update({
      where: { id: record.id },
      data: { lastUsedAt: new Date() },
     });

     return {
      id: record.user.id,
      email: record.user.email,
      username: record.user.username,
      role: record.user.role,
     };
    }
   }

   return null;
  } catch (error) {
   logger.error('Failed to verify API key:', error);
   return null;
  }
 }

 async getUserApiKeys(userId: string) {
  try {
   return await prisma.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
   });
  } catch (error) {
   logger.error('Failed to get user API keys:', error);
   return [];
  }
 }

 async deleteApiKey(apiKeyId: string, userId: string): Promise<boolean> {
  try {
   await prisma.apiKey.deleteMany({
    where: {
     id: apiKeyId,
     userId: userId,
    },
   });

   return true;
  } catch (error) {
   logger.error('Failed to delete API key:', error);
   return false;
  }
 }

 private generateRandomString(length: number): string {
  const chars =
   'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
   result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
 }

 // Password Reset Methods
 async requestPasswordReset(email: string): Promise<boolean> {
  try {
   const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
   });

   if (!user || !user.isActive) {
    return false;
   }

   // Generate reset token
   const resetToken = this.generateRandomString(32);
   const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

   // Store reset token in database
   await prisma.user.update({
    where: { id: user.id },
    data: {
     resetToken: resetToken,
     resetTokenExpiry: resetTokenExpiry,
    },
   });

   // Send password reset email asynchronously (don't block response)
   const userName = `${user.firstName} ${user.lastName}`;
   emailService
    .sendPasswordResetEmail(email, resetToken, userName)
    .then((emailSent) => {
     if (emailSent) {
      logger.info(`Password reset email sent to: ${email}`);
     } else {
      logger.error(`Failed to send password reset email to: ${email}`);
     }
    })
    .catch((error) => {
     logger.error('Failed to send password reset email:', error);
    });

   return true;
  } catch (error) {
   logger.error('Failed to request password reset:', error);
   return false;
  }
 }

 async confirmPasswordReset(
  token: string,
  newPassword: string
 ): Promise<boolean> {
  try {
   // Find user with this reset token
   const user = await prisma.user.findFirst({
    where: {
     resetToken: token,
     resetTokenExpiry: { gt: new Date() },
     isActive: true,
    },
   });

   if (!user) {
    return false;
   }

   // Hash new password
   const saltRounds = 12;
   const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

   // Update password and clear reset token
   await prisma.user.update({
    where: { id: user.id },
    data: {
     password: hashedPassword,
     resetToken: null,
     resetTokenExpiry: null,
     updatedAt: new Date(),
    },
   });

   logger.info(`Password reset successful for user: ${user.email}`);
   return true;
  } catch (error) {
   logger.error('Failed to confirm password reset:', error);
   return false;
  }
 }
}

// Create and export user service instance
export const userService = new UserService();
