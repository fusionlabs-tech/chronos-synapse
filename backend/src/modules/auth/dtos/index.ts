export interface LoginDto {
 email: string;
 password?: string;
}

export interface RegisterDto {
 email: string;
 username: string;
 firstName: string;
 lastName: string;
 password?: string;
}

export interface RefreshTokenDto {
 refreshToken: string;
}

export interface OAuthCallbackDto {
 code: string;
 state?: string;
}

export interface UpdateProfileDto {
 firstName?: string;
 lastName?: string;
 username?: string;
 email?: string;
}
