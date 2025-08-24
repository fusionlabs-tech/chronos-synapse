import prisma from '../lib/prisma';
import crypto from 'node:crypto';
import { logger } from '../utils/logger';
import { AiProvider } from '@prisma/client';
import {
 createAIProviderAdapter,
 AIProviderAdapter,
 ProviderConfig,
} from '../adapters/ai/AIProviderAdapter';

function getCryptoKey(): Buffer {
 const base = process.env.AI_SECRET_KEY;
 console.log(
  'AI_SECRET_KEY from env:',
  base ? `${base.substring(0, 10)}...` : 'undefined'
 );
 console.log('AI_EXTERNAL_ENABLED from env:', process.env.AI_EXTERNAL_ENABLED);

 if (!base) throw new Error('AI_SECRET_KEY is required');

 // Use plain string key directly
 const raw = Buffer.from(base, 'utf8');
 console.log('Key buffer length:', raw.length);

 // Ensure we have at least 32 bytes for AES-256-GCM
 if (raw.length >= 32) return raw.subarray(0, 32);
 const buf = Buffer.alloc(32);
 raw.copy(buf);
 return buf;
}

export class AIKeyService {
 private adapterCache: Map<
  string,
  { adapter: AIProviderAdapter; expiresAt: number }
 > = new Map();

 encryptApiKey(plain: string): string {
  const key = getCryptoKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
 }

 decryptApiKey(encBase64: string): string {
  const buf = Buffer.from(encBase64, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', getCryptoKey(), iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return dec.toString('utf8');
 }

 async getDefaultKey(userId: string): Promise<{
  provider: AiProvider;
  apiKey: string;
  defaultModel?: string | null;
  endpointBase?: string | null;
  orgId?: string | null;
 } | null> {
  try {
   const row = await prisma.aiKey.findFirst({
    where: { userId, isActive: true },
    orderBy: { updatedAt: 'desc' },
   });
   if (!row) return null;
   const apiKey = this.decryptApiKey(row.apiKeyEnc);
   return {
    provider: row.provider,
    apiKey,
    defaultModel: row.defaultModel,
    endpointBase: row.endpointBase,
    orgId: row.orgId,
   };
  } catch (e) {
   logger.error('AIKeyService.getDefaultKey failed', e);
   return null;
  }
 }

 private buildAdapter(cfg: ProviderConfig): AIProviderAdapter {
  return createAIProviderAdapter(cfg);
 }

 async buildAdapterForUser(userId: string): Promise<AIProviderAdapter | null> {
  if (
   String(process.env.AI_EXTERNAL_ENABLED || 'true').toLowerCase() === 'false'
  )
   return null;
  const cached = this.adapterCache.get(userId);
  const now = Date.now();
  if (cached && cached.expiresAt > now) return cached.adapter;

  const key = await this.getDefaultKey(userId);
  if (!key) return null;
  const cfg: ProviderConfig = {
   provider: key.provider,
   apiKey: key.apiKey,
   endpointBase: key.endpointBase || undefined,
   defaultModel: key.defaultModel || undefined,
   orgId: key.orgId || undefined,
  };
  const adapter = this.buildAdapter(cfg);
  this.adapterCache.set(userId, { adapter, expiresAt: now + 5 * 60_000 });
  return adapter;
 }

 async buildAdapterByKeyId(
  userId: string,
  id: string
 ): Promise<AIProviderAdapter | null> {
  if (
   String(process.env.AI_EXTERNAL_ENABLED || 'true').toLowerCase() === 'false'
  )
   return null;
  const row = await prisma.aiKey.findFirst({ where: { id, userId } });
  if (!row) return null;
  const cfg: ProviderConfig = {
   provider: row.provider,
   apiKey: this.decryptApiKey(row.apiKeyEnc),
   endpointBase: row.endpointBase || undefined,
   defaultModel: row.defaultModel || undefined,
   orgId: row.orgId || undefined,
  };
  return this.buildAdapter(cfg);
 }
}

export const aiKeyService = new AIKeyService();
