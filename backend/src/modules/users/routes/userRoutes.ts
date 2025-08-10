import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { requireAuth, AuthenticatedRequest } from '../../../middleware/auth';
import { userService } from '../../../services/UserService';

export default async function userRoutes(fastify: FastifyInstance) {
 // List API keys for current user
 fastify.get(
  '/api-keys',
  { preHandler: requireAuth },
  async (request: AuthenticatedRequest, reply: FastifyReply) => {
   const user = request.user!;
   const keys = await userService.getUserApiKeys(user.id);
   // Do not return raw keys; provide metadata only. Frontend shows real key only on creation modal.
   return reply.send({
    success: true,
    keys: keys.map((k: any) => ({
     id: k.id,
     name: k.name,
     key: 'hidden',
     permissions: k.permissions || [],
     isActive: k.isActive,
     createdAt: k.createdAt,
     lastUsedAt: k.lastUsedAt || undefined,
    })),
   });
  }
 );

 // Create a new API key (default ingest scope)
 fastify.post(
  '/api-keys',
  { preHandler: requireAuth },
  async (request: AuthenticatedRequest, reply: FastifyReply) => {
   const user = request.user!;
   const body = request.body as { name: string };
   if (!body?.name || typeof body.name !== 'string') {
    return reply
     .status(400)
     .send({ success: false, error: 'Name is required' });
   }
   const { id, key } = await userService.createApiKey(user.id, body.name, [
    'ingest',
   ]);
   return reply.send({ id, key, name: body.name, permissions: ['ingest'] });
  }
 );

 // Delete an API key
 fastify.delete(
  '/api-keys/:id',
  { preHandler: requireAuth },
  async (request: AuthenticatedRequest, reply: FastifyReply) => {
   const user = request.user!;
   const { id } = request.params as { id: string };
   const ok = await userService.deleteApiKey(id, user.id);
   if (!ok) return reply.status(400).send({ success: false });
   return reply.send({ success: true });
  }
 );
}
