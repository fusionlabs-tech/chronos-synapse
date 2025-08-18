import { FastifyInstance, FastifyReply } from 'fastify';
import { requireAuth, AuthenticatedRequest } from '../../../middleware/auth';
import prisma from '../../../lib/prisma';
import { aiKeyService } from '../../../services/AIKeyService';

export default async function aiKeyRoutes(fastify: FastifyInstance) {
 // List AI keys (masked)
 fastify.get(
  '/ai-keys',
  { preHandler: requireAuth },
  async (req: AuthenticatedRequest, reply: FastifyReply) => {
   const user = req.user!;
   const rows = await prisma.aiKey.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
   });
   const masked = rows.map((r) => ({
    id: r.id,
    provider: r.provider,
    alias: r.alias,
    maskedKey: '••••' + (r.apiKeyEnc ? '****' : ''),
    defaultModel: r.defaultModel || undefined,
    endpointBase: r.endpointBase || undefined,
    orgId: r.orgId || undefined,
    isActive: r.isActive,
    createdAt: r.createdAt,
    lastUsedAt: r.lastUsedAt || undefined,
   }));
   return reply.send({ success: true, keys: masked });
  }
 );

 // Create AI key
 fastify.post(
  '/ai-keys',
  { preHandler: requireAuth },
  async (req: AuthenticatedRequest, reply: FastifyReply) => {
   const user = req.user!;
   const body = req.body as any;
   const { provider, alias, apiKey, defaultModel, endpointBase, orgId } =
    body || {};
   if (!provider || !apiKey)
    return reply
     .status(400)
     .send({ success: false, error: 'provider and apiKey are required' });
   const enc = aiKeyService.encryptApiKey(String(apiKey));
   const row = await prisma.aiKey.create({
    data: {
     userId: user.id,
     provider,
     alias,
     apiKeyEnc: enc,
     defaultModel: defaultModel || null,
     endpointBase: endpointBase || null,
     orgId: orgId || null,
     isActive: true,
    },
   });
   return reply.send({ success: true, id: row.id });
  }
 );

 // Delete AI key
 fastify.delete(
  '/ai-keys/:id',
  { preHandler: requireAuth },
  async (req: AuthenticatedRequest, reply: FastifyReply) => {
   const user = req.user!;
   const { id } = req.params as any;
   await prisma.aiKey.deleteMany({ where: { id, userId: user.id } });
   return reply.send({ success: true });
  }
 );

 // Test AI key against provider
 fastify.post(
  '/ai-keys/:id/test',
  { preHandler: requireAuth },
  async (req: AuthenticatedRequest, reply: FastifyReply) => {
   const user = req.user!;
   const { id } = req.params as any;
   try {
    console.log('Testing AI key:', { userId: user.id, keyId: id });

    const adapter = await aiKeyService.buildAdapterByKeyId(user.id, id);
    if (!adapter) {
     console.log('No adapter available');
     return reply.send({
      success: true,
      ok: false,
      error: 'adapter_unavailable',
     });
    }

    console.log('Adapter created, testing with provider...');

    // Simple timeout wrapper
    const timeoutPromise = new Promise<never>((_, reject) => {
     setTimeout(() => reject(new Error('timeout')), 7000);
    });

    const result = await Promise.race([
     adapter.chatJSON('Return {"ok":true} exactly as JSON.', {
      system: 'Respond with strict JSON only.',
     }),
     timeoutPromise,
    ]);

    console.log('Provider response:', result);
    const ok = !!(result && (result.ok === true || result.success === true));
    return reply.send({ success: true, ok });
   } catch (e: any) {
    console.error('AI key test error:', e);
    return reply.send({ success: true, ok: false, error: 'provider_error' });
   }
  }
 );
}
