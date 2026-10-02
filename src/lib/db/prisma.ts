/**
 * Prisma Client singleton for Next.js — Prisma v7 with libsql driver adapter
 * Prevents multiple instances during hot-reload in development.
 * Import this everywhere instead of creating new PrismaClient().
 *
 * Prisma v7 requires a driver adapter (not a direct URL in schema).
 * For SQLite we use @prisma/adapter-libsql + @libsql/client.
 * To swap to PostgreSQL: replace with @prisma/adapter-pg.
 */

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";

function createPrismaClient() {
  const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";

  // libsql accepts "file:./path" directly — PrismaLibSql takes a Config object
  const adapter = new PrismaLibSql({ url });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return new PrismaClient({ adapter } as any);
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
