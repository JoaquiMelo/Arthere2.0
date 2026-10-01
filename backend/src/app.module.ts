import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsuariosModule } from './usuarios/usuarios.module';
import { ProjetosModule } from './projetos/projetos.module';
import { EventosModule } from './eventos/eventos.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { AvaliacoesModule } from './avaliacoes/avaliacoes.module';
@Module({imports:[PrismaModule,AuthModule,UsuariosModule,ProjetosModule,EventosModule,PortfolioModule,AvaliacoesModule]})
export class AppModule {}