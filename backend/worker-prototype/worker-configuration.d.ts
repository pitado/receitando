/* eslint-disable */
interface __BaseEnv_Env {
  db: D1Database;
  FRONTEND_URL: string;
  RESEND_API_KEY?: string;
  EMAIL_FROM?: string;
  IMPORT_API_KEY?: string;
  THEMEALDB_API_KEY?: string;
}

declare namespace Cloudflare {
  interface GlobalProps {
    mainModule: typeof import("./src/source-import-worker");
  }
  interface Env extends __BaseEnv_Env {}
}

interface Env extends __BaseEnv_Env {}

// Cloudflare Workers accepts typed-array salts for PBKDF2 at runtime. This
// overload bridges a TypeScript 5.9 BufferSource generic mismatch in the
// generated Workers types without changing runtime behavior.
interface SubtleCrypto {
  deriveBits(algorithm: unknown, baseKey: CryptoKey, length: number): Promise<ArrayBuffer>;
}
