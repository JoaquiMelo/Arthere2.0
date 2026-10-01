import "dotenv/config";
import { defineConfig } from "prisma/config";

function normalizeDatabaseUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL não foi definida.");

  const match = raw.match(/^mysql:\/\/([^:]+):(.+)@([^:/]+):(\d+)\/([^?]+)(?:\?.*)?$/);
  if (!match) return raw;

  const [, user, password, host, port, database] = match;
  const decodedPassword = decodeURIComponent(password);
  return "mysql://" + encodeURIComponent(user) + ":" + encodeURIComponent(decodedPassword) + "@" + host + ":" + port + "/" + database;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: normalizeDatabaseUrl(),
  },
});
