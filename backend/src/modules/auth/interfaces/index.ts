export interface User {
 id: string;
 email: string;
 username: string;
 firstName: string;
 lastName: string;
 role: 'USER' | 'ADMIN';
 isActive: boolean;
 createdAt: Date;
 updatedAt: Date;
 lastLoginAt?: Date | null;
 oauthProvider?: 'GOOGLE' | 'GITHUB';
 emailVerified?: boolean;
}

export interface CreateUserRequest {
 email: string;
 username: string;
 firstName: string;
 lastName: string;
 role: 'USER' | 'ADMIN';
 oauthProvider: 'GOOGLE' | 'GITHUB';
 oauthId: string;
 avatar?: string | null;
}

export interface UpdateUserRequest {
 email?: string;
 username?: string;
 firstName?: string;
 lastName?: string;
 isActive?: boolean;
 role?: 'USER' | 'ADMIN';
 oauthProvider?: 'GOOGLE' | 'GITHUB' | null;
 oauthId?: string | null;
 avatar?: string | null;
 lastLoginAt?: string;
}

export interface LoginResponse {
 user: User;
 token: string;
 refreshToken: string;
 expiresIn: number;
}

export interface AuthUser {
 id: string;
 email: string;
 username: string;
 role: 'USER' | 'ADMIN';
}
