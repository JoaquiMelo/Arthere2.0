import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjetosService } from './projetos.service';
@Controller('projetos')
export class ProjetosController {
  constructor(private s: ProjetosService) {}
  @Get() listar(@Query('categoria') categoria?: string, @Query('cidade') cidade?: string, @Query('busca') busca?: string) { return this.s.listar({ categoria, cidade, busca }); }
  @Get(':id') buscar(@Param('id') id: string) { return this.s.buscar(id); }
  @Get('minhas/candidaturas') @UseGuards(JwtAuthGuard) minhas(@Req() r: any) { return this.s.minhasCandidaturas(r.user.id); }
  @Get(':id/candidaturas') @UseGuards(JwtAuthGuard) candidaturas(@Req() r: any, @Param('id') id: string) { return this.s.candidaturasDoProjeto(r.user.id, id); }
  @Post() @UseGuards(JwtAuthGuard) criar(@Req() r: any, @Body() d: any) { return this.s.criar(r.user.id, d); }
  @Patch(':id') @UseGuards(JwtAuthGuard) atualizar(@Req() r: any, @Param('id') id: string, @Body() d: any) { return this.s.atualizar(r.user.id, id, d); }
  @Post(':id/candidaturas') @UseGuards(JwtAuthGuard) candidatar(@Req() r: any, @Param('id') id: string, @Body() d: any) { return this.s.candidatar(r.user.id, id, d.mensagem); }
  @Patch('candidaturas/:id') @UseGuards(JwtAuthGuard) alterarCandidatura(@Req() r: any, @Param('id') id: string, @Body() d: any) { return this.s.alterarCandidatura(r.user.id, id, d.status); }
}