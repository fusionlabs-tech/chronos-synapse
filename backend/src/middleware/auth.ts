import { FastifyRequest, FastifyReply, RouteGenericInterface } from 'fastify';
import { userService } from '../services/UserService';
import { AuthUser } from '../types/user';

export interface AuthenticatedRequest<T extends RouteGenericInterface = {}>
 extends FastifyRequest<T> {
 user?: AuthUser;
}

export async function authenticate(
 request: AuthenticatedRequest,
 reply: FastifyReply
) {
 try {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
   return reply
    .status(401)
    .send({ error: 'Unauthorized', message: 'No valid authorization header' });
  }

  const token = authHeader.substring(7);
  const user = await userService.verifyToken(token);

  if (!user) {
   return reply
    .status(401)
    .send({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }

  request.user = user;
 } catch (error) {
  return reply
   .status(401)
   .send({ error: 'Unauthorized', message: 'Authentication failed' });
 }
}

export async function requireAdmin(
 request: AuthenticatedRequest,
 reply: FastifyReply
) {
 await authenticate(request, reply);

 if (request.user?.role !== 'ADMIN') {
  return reply
   .status(403)
   .send({ error: 'Forbidden', message: 'Admin access required' });
 }
}

export async function requireAuth(
 request: AuthenticatedRequest,
 reply: FastifyReply
) {
 await authenticate(request, reply);
}

export interface ApiKeyRequest extends AuthenticatedRequest {
 apiUser?: { id: string; email: string; username: string; role: string };
}

export async function requireApiKey(
 request: FastifyRequest,
 reply: FastifyReply
) {
 const apiKey = request.headers['x-api-key'] as string | undefined;
 if (!apiKey) {
  return reply.status(401).send({ success: false, error: 'Missing API key' });
 }
 const user = await userService.verifyApiKey(apiKey);
 if (!user) {
  return reply.status(401).send({ success: false, error: 'Invalid API key' });
 }
 (request as ApiKeyRequest).apiUser = user;
}
