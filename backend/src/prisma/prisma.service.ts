import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

function databaseConfig() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error('DATABASE_URL não foi definida.');
  const url = new URL(raw);
  return {
    host: url.hostname,
    port: Number(url.port || 3306),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, '')),
    connectionLimit: Number(process.env.DATABASE_CONNECTION_LIMIT || 10),
    connectTimeout: Number(process.env.DATABASE_CONNECT_TIMEOUT || 5000),
    acquireTimeout: Number(process.env.DATABASE_ACQUIRE_TIMEOUT || 10000),
  };
}

const adapter = new PrismaMariaDb(databaseConfig());

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() { super({ adapter }); }
  async onModuleInit() { await this.$connect(); }
  async onModuleDestroy() { await this.$disconnect(); }
}