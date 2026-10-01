import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/client';
import 'dotenv/config';

function databaseConfig() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error('DATABASE_URL não foi definida.');

  const match = raw.match(/^mysql:\/\/([^:]+):(.+)@([^:/]+):(\d+)\/([^?]+)(?:\?.*)?$/);
  if (!match) {
    throw new Error('DATABASE_URL inválida. Use mysql://usuario:senha@host:3306/banco.');
  }

  const [, user, password, host, port, database] = match;

  return {
    host,
    port: Number(port),
    user: decodeURIComponent(user),
    password: decodeURIComponent(password),
    database,
    connectionLimit: Number(process.env.DATABASE_CONNECTION_LIMIT ?? 10),
    connectTimeout: Number(process.env.DATABASE_CONNECT_TIMEOUT ?? 10000),
    acquireTimeout: Number(process.env.DATABASE_ACQUIRE_TIMEOUT ?? 10000),
  };
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ adapter: new PrismaMariaDb(databaseConfig()) });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
