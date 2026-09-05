import { createClient, type RedisClientType } from 'redis';

declare global {
  // eslint-disable-next-line no-var
  var __redisClient: RedisClientType | undefined;
}

let client: RedisClientType;

if (process.env.NODE_ENV === 'production') {
  client = createClient({
    url: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
    socket: { connectTimeout: 2000 },
  });
} else {
  if (!globalThis.__redisClient) {
    globalThis.__redisClient = createClient({
      url: process.env.REDIS_URL ?? 'redis://127.0.0.1:6379',
      socket: { connectTimeout: 2000 },
    });
  }
  client = globalThis.__redisClient;
}

let connected = false;
const connecting = client.connect().then(() => {
  connected = true;
}).catch((err) => {
  console.error('[redis] failed to connect on init:', err);
});

client.on('error', (err) => {
  console.error('[redis] client error:', err.message);
  connected = false;
});

export async function getRedis(): Promise<RedisClientType> {
  if (connected) return client;
  await connecting;
  return client;
}

const OTP_TTL_DEMO = 30 * 60;
const OTP_TTL_REAL = 5 * 60;

export async function saveOtp(phone: string, otp: string, demo = false): Promise<void> {
  const redis = await getRedis();
  const ttl = demo ? OTP_TTL_DEMO : OTP_TTL_REAL;
  await Promise.all([
    redis.set(`otp:${phone}`, otp, { EX: ttl }),
    redis.set(`otp:lock:${phone}`, '1', { EX: 30 }),
  ]);
}

export async function getOtp(phone: string): Promise<string | null> {
  const redis = await getRedis();
  return redis.get(`otp:${phone}`);
}

export async function deleteOtp(phone: string): Promise<void> {
  const redis = await getRedis();
  await redis.del([`otp:${phone}`, `otp:lock:${phone}`]);
}

export async function isOtpRateLimited(phone: string): Promise<boolean> {
  const redis = await getRedis();
  return (await redis.exists(`otp:lock:${phone}`)) === 1;
}
