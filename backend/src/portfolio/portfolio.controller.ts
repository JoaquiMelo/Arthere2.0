import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PortfolioService } from './portfolio.service';
@Controller('portfolio')
export class PortfolioController {
  constructor(private s: PortfolioService) {}
  @Get(':agenteId') listar(@Param('agenteId') agenteId: string) { return this.s.listar(agenteId); }
  @Post() @UseGuards(JwtAuthGuard) criar(@Req() r: any, @Body() d: any) { return this.s.criar(r.user.id, d); }
  @Patch(':id') @UseGuards(JwtAuthGuard) atualizar(@Req() r: any, @Param('id') id: string, @Body() d: any) { return this.s.atualizar(r.user.id, id, d); }
  @Delete(':id') @UseGuards(JwtAuthGuard) remover(@Req() r: any, @Param('id') id: string) { return this.s.remover(r.user.id, id); }
}