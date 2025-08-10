import { FastifyInstance, FastifyReply } from 'fastify';
import { requireAuth, AuthenticatedRequest } from '../../../middleware/auth';
import prisma from '../../../lib/prisma';
import crypto from 'node:crypto';

function getCryptoKey(): Buffer {
 const base = process.env.AI_SECRET_KEY;
 if (!base) throw new Error('AI_SECRET_KEY is required');
 const raw = Buffer.from(base, 'base64').toString('utf8');
 const buf = Buffer.alloc(32);
 Buffer.from(raw).copy(buf);
 return buf;
}

function encrypt(plain: string): string {
 const key = getCryptoKey();
 const iv = crypto.randomBytes(12);
 const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
 const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
 const tag = cipher.getAuthTag();
 return Buffer.concat([iv, tag, enc]).toString('base64');
}

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
   const enc = encrypt(String(apiKey));
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

 // Test AI key (no external call for now)
 fastify.post(
  '/ai-keys/:id/test',
  { preHandler: requireAuth },
  async (req: AuthenticatedRequest, reply: FastifyReply) => {
   // Placeholder: return ok=true; provider checks can be added later
   return reply.send({ success: true, ok: true });
  }
 );
}
