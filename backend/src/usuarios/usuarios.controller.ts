import { Body, Controller, Get, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
export class UsuariosController {
  constructor(private s: UsuariosService) {}

  @Get('agentes')
  agentes(@Query('cidade') cidade?: string, @Query('especialidade') especialidade?: string, @Query('busca') busca?: string) {
    return this.s.listarAgentes({ cidade, especialidade, busca });
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  me(@Req() r: any) { return this.s.meuPerfil(r.user.id); }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  update(@Req() r: any, @Body() d: any) { return this.s.atualizarMeuPerfil(r.user.id, r.user.tipo, d); }
}