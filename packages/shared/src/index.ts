// Shared types between apps/web and apps/api.
// B agent (frontend) and C agent (backend) should extend this file.

export type HealthStatus = {
  status: "ok";
  uptime: number;
};

export const API_PORTS = {
  web: 3000,
  api: 3001,
} as const;
