import {Injectable,OnModuleDestroy,OnModuleInit} from '@nestjs/common'; import {PrismaMariaDb} from '@prisma/adapter-mariadb'; import {PrismaClient} from '@prisma/client'; import 'dotenv/config';
const url=process.env.DATABASE_URL; if(!url) throw new Error('DATABASE_URL não foi definida.');
const adapter=new PrismaMariaDb(url);
@Injectable() export class PrismaService extends PrismaClient implements OnModuleInit,OnModuleDestroy { constructor(){super({adapter});} async onModuleInit(){await this.$connect();} async onModuleDestroy(){await this.$disconnect();} }