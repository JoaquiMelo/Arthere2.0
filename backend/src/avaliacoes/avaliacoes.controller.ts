import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AvaliacoesService } from './avaliacoes.service';
@Controller('avaliacoes')
export class AvaliacoesController {
  constructor(private s: AvaliacoesService) {}
  @Get('agente/:agenteId') listar(@Param('agenteId') agenteId: string) { return this.s.listarAgente(agenteId); }
  @Post('agente/:agenteId') @UseGuards(JwtAuthGuard) criar(@Req() r: any, @Param('agenteId') agenteId: string, @Body() d: any) { return this.s.criar(r.user.id, agenteId, Number(d.nota), d.comentario); }
}