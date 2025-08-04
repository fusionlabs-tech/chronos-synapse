export interface PasswordValidationResult {
 isValid: boolean;
 errors: string[];
 score: number; // 0-4 (0=very weak, 4=very strong)
}

export function validatePassword(password: string): PasswordValidationResult {
 const errors: string[] = [];
 let score = 0;

 // Check minimum length
 if (password.length < 8) {
  errors.push('Password must be at least 8 characters long');
 } else {
  score += 1;
 }

 // Check for uppercase letters
 if (!/[A-Z]/.test(password)) {
  errors.push('Password must contain at least one uppercase letter');
 } else {
  score += 1;
 }

 // Check for lowercase letters
 if (!/[a-z]/.test(password)) {
  errors.push('Password must contain at least one lowercase letter');
 } else {
  score += 1;
 }

 // Check for numbers
 if (!/\d/.test(password)) {
  errors.push('Password must contain at least one number');
 } else {
  score += 1;
 }

 // Check for special characters
 if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
  errors.push('Password must contain at least one special character');
 } else {
  score += 1;
 }

 // Bonus points for length
 if (password.length >= 12) {
  score += 1;
 }

 // Cap score at 4
 score = Math.min(score, 4);

 return {
  isValid: errors.length === 0,
  errors,
  score,
 };
}

export function getPasswordStrengthText(score: number): string {
 switch (score) {
  case 0:
  case 1:
   return 'Very Weak';
  case 2:
   return 'Weak';
  case 3:
   return 'Good';
  case 4:
   return 'Strong';
  default:
   return 'Unknown';
 }
}

export function getPasswordStrengthColor(score: number): string {
 switch (score) {
  case 0:
  case 1:
   return 'red';
  case 2:
   return 'orange';
  case 3:
   return 'yellow';
  case 4:
   return 'green';
  default:
   return 'gray';
 }
}
