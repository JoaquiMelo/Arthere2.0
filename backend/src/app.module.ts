import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ProjetosModule } from './projetos/projetos.module';
import { EventosModule } from './eventos/eventos.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { AvaliacoesModule } from './avaliacoes/avaliacoes.module';
import { HealthController } from './health.controller';
@Module({imports:[PrismaModule,AuthModule,UsuariosModule,ProjetosModule,EventosModule,PortfolioModule,AvaliacoesModule],controllers:[HealthController]})
export class AppModule {}