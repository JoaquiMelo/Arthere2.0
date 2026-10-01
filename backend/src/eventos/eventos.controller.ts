import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { EventosService } from './eventos.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
@Controller('eventos')
export class EventosController {
  constructor(private s: EventosService) {}
  @Get() listar(@Query('cidade') cidade?: string, @Query('categoria') categoria?: string, @Query('busca') busca?: string) { return this.s.listar({ cidade, categoria, busca }); }
  @Get(':id') buscar(@Param('id') id: string) { return this.s.buscar(id); }
  @Post() @UseGuards(JwtAuthGuard) criar(@Req() r: any, @Body() d: any) { return this.s.criar(r.user.id, d); }
  @Patch(':id') @UseGuards(JwtAuthGuard) atualizar(@Req() r: any, @Param('id') id: string, @Body() d: any) { return this.s.atualizar(r.user.id, id, d); }
  @Delete(':id') @UseGuards(JwtAuthGuard) remover(@Req() r: any, @Param('id') id: string) { return this.s.remover(r.user.id, id); }
}