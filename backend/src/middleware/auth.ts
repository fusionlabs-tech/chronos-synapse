import { FastifyRequest, FastifyReply } from 'fastify';
import { userService } from '../services/UserService';
import { AuthUser } from '../types/user';

export interface AuthenticatedRequest extends FastifyRequest {
 user?: AuthUser;
}

export async function authenticate(
 request: AuthenticatedRequest,
 reply: FastifyReply
) {
 try {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
   return reply.status(401).send({
    error: 'Unauthorized',
    message: 'No valid authorization header',
   });
  }

  const token = authHeader.substring(7); // Remove 'Bearer ' prefix
  const user = await userService.verifyToken(token);

  if (!user) {
   return reply.status(401).send({
    error: 'Unauthorized',
    message: 'Invalid or expired token',
   });
  }

  request.user = user;
 } catch (error) {
  return reply.status(401).send({
   error: 'Unauthorized',
   message: 'Authentication failed',
  });
 }
}

export async function requireAdmin(
 request: AuthenticatedRequest,
 reply: FastifyReply
) {
 await authenticate(request, reply);

 if (request.user?.role !== 'ADMIN') {
  return reply.status(403).send({
   error: 'Forbidden',
   message: 'Admin access required',
  });
 }
}

export async function requireAuth(
 request: AuthenticatedRequest,
 reply: FastifyReply
) {
 await authenticate(request, reply);
}
