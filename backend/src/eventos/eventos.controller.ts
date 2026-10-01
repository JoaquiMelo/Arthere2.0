import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EventosService } from './eventos.service';

@Controller('eventos')
export class EventosController {
 constructor(private readonly service:EventosService){}
 @Get() listar(@Query('cidade') cidade?:string,@Query('categoria') categoria?:string,@Query('busca') busca?:string){return this.service.listar({cidade,categoria,busca});}
 @Get(':id') obter(@Param('id') id:string){return this.service.obter(id);}
 @UseGuards(JwtAuthGuard) @Post() criar(@Req() req:any,@Body() dados:any){return this.service.criar(req.user.id,dados);}
 @UseGuards(JwtAuthGuard) @Patch(':id') atualizar(@Req() req:any,@Param('id') id:string,@Body() dados:any){return this.service.atualizar(req.user.id,id,dados);}
 @UseGuards(JwtAuthGuard) @Delete(':id') remover(@Req() req:any,@Param('id') id:string){return this.service.remover(req.user.id,id);}
}