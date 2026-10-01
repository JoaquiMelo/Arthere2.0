import { Body, Controller, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ProjetosService } from './projetos.service';

@Controller('projetos')
export class ProjetosController {
 constructor(private readonly service:ProjetosService){}
 @Get() listar(@Query('categoria') categoria?:string,@Query('cidade') cidade?:string,@Query('busca') busca?:string,@Query('status') status?:string){return this.service.listar({categoria,cidade,busca,status});}
 @UseGuards(JwtAuthGuard) @Get('minhas') meus(@Req() req:any){return this.service.meus(req.user.id);}
 @UseGuards(JwtAuthGuard) @Get('minhas/candidaturas') minhas(@Req() req:any){return this.service.minhasCandidaturas(req.user.id);}
 @UseGuards(JwtAuthGuard) @Get(':id/candidaturas') candidaturas(@Req() req:any,@Param('id') id:string){return this.service.candidaturasDoProjeto(req.user.id,id);}
 @Get(':id') obter(@Param('id') id:string){return this.service.obter(id);}
 @UseGuards(JwtAuthGuard) @Post() criar(@Req() req:any,@Body() dados:any){return this.service.criar(req.user.id,dados);}
 @UseGuards(JwtAuthGuard) @Patch('candidaturas/:id') atualizarCandidatura(@Req() req:any,@Param('id') id:string,@Body() dados:any){return this.service.atualizarCandidatura(req.user.id,id,dados.status);}
 @UseGuards(JwtAuthGuard) @Patch(':id') atualizar(@Req() req:any,@Param('id') id:string,@Body() dados:any){return this.service.atualizar(req.user.id,id,dados);}
 @UseGuards(JwtAuthGuard) @Post(':id/candidaturas') candidatar(@Req() req:any,@Param('id') id:string,@Body() dados:any){return this.service.candidatar(req.user.id,id,dados?.mensagem);}
}