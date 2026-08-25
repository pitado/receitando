/* eslint-disable */
interface __BaseEnv_Env {
  db: D1Database;
  FRONTEND_URL: string;
  EMAIL_FROM?: string;
  RESEND_API_KEY?: string;
}

declare namespace Cloudflare {
  interface GlobalProps {
    mainModule: typeof import("./src/home-worker");
  }
  interface Env extends __BaseEnv_Env {}
}

interface Env extends __BaseEnv_Env {}

// Cloudflare Workers accepts typed-array salts for PBKDF2 at runtime. This
// overload bridges a TypeScript generic mismatch in the Workers types without
// changing runtime behavior.
interface SubtleCrypto {
  deriveBits(algorithm: unknown, baseKey: CryptoKey, length: number): Promise<ArrayBuffer>;
}
