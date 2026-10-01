import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PortfolioService } from './portfolio.service';
@Controller('portfolio')
export class PortfolioController {
 constructor(private readonly service:PortfolioService){}
 @Get(':agenteId') listar(@Param('agenteId') agenteId:string){return this.service.listar(agenteId);}
 @UseGuards(JwtAuthGuard) @Post() criar(@Req() req:any,@Body() dados:any){return this.service.criar(req.user.id,dados);}
 @UseGuards(JwtAuthGuard) @Patch(':id') atualizar(@Req() req:any,@Param('id') id:string,@Body() dados:any){return this.service.atualizar(req.user.id,id,dados);}
 @UseGuards(JwtAuthGuard) @Delete(':id') remover(@Req() req:any,@Param('id') id:string){return this.service.remover(req.user.id,id);}
}