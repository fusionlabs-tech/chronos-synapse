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
}

export interface CreateUserRequest {
 email: string;
 username: string;
 firstName: string;
 lastName: string;
 password: string;
 role?: 'USER' | 'ADMIN';
}

export interface UpdateUserRequest {
 email?: string;
 username?: string;
 firstName?: string;
 lastName?: string;
 isActive?: boolean;
 role?: 'USER' | 'ADMIN';
}

export interface LoginRequest {
 email: string;
 password: string;
}

export interface LoginResponse {
 user: User;
 token: string;
 expiresIn: number;
}

export interface AuthUser {
 id: string;
 email: string;
 username: string;
 role: 'USER' | 'ADMIN';
}
