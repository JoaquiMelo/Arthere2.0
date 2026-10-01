import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AvaliacoesService } from './avaliacoes.service';
@Controller('avaliacoes')
export class AvaliacoesController {
 constructor(private readonly service:AvaliacoesService){}
 @Get('agente/:agenteId') listar(@Param('agenteId') agenteId:string){return this.service.listar(agenteId);}
 @UseGuards(JwtAuthGuard) @Post('agente/:agenteId') avaliar(@Req() req:any,@Param('agenteId') agenteId:string,@Body() dados:any){return this.service.avaliar(req.user.id,agenteId,dados);}
}