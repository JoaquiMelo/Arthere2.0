import { Body, Controller, Get, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  @Get('agentes')
  listarAgentes(@Query('cidade') cidade?: string, @Query('especialidade') especialidade?: string, @Query('busca') busca?: string) {
    return this.service.listarAgentes({ cidade, especialidade, busca });
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  me(@Req() req: any) {
    return this.service.meuPerfil(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('me')
  update(@Req() req: any, @Body() dados: any) {
    return this.service.atualizarMeuPerfil(req.user.id, req.user.tipo, dados);
  }
}
