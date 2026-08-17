/* eslint-disable */
interface __BaseEnv_Env {
  db: D1Database;
  FRONTEND_URL: string;
}

declare namespace Cloudflare {
  interface GlobalProps {
    mainModule: typeof import("./src/index");
  }
  interface Env extends __BaseEnv_Env {}
}

interface Env extends __BaseEnv_Env {}
