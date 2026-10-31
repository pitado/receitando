/* eslint-disable */
// Worker bindings declarados para a arquitetura PostgreSQL em produção.
interface __BaseEnv_Env {
  DATABASE_ENGINE: "postgres";
  HYPERDRIVE: Hyperdrive;
  COOKING_ROOMS: DurableObjectNamespace;
  FRONTEND_URL: string;
  EMAIL_FROM?: string;
  RESEND_API_KEY?: string;
  RECIPE_IMAGES?: R2Bucket;
}
declare namespace Cloudflare {
  interface GlobalProps { mainModule: typeof import("./src/session-cookie-worker"); }
  interface Env extends __BaseEnv_Env {}
}
interface Env extends __BaseEnv_Env {}
interface SubtleCrypto {
  deriveBits(algorithm: unknown, baseKey: CryptoKey, length: number): Promise<ArrayBuffer>;
}
