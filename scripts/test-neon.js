require("dotenv/config");
const { PrismaClient } = require("../src/generated/prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

const url = process.env.DATABASE_URL;
console.log("URL:", url ? url.replace(/:([^@]+)@/, ":***@") : "NOT SET");

const adapter = new PrismaPg({ connectionString: url });
const prisma = new PrismaClient({ adapter });

prisma.$connect()
  .then(() => {
    console.log("✅ Connected to Neon!");
    return prisma.$disconnect();
  })
  .catch((e) => {
    console.error("❌ Connection failed:", e.message);
    process.exit(1);
  });
