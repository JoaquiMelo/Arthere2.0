import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ChatService } from './chat.service';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly service: ChatService) {}

  @Get('conversas')
  listar(@Req() req: any) {
    return this.service.listar(req.user.id);
  }

  @Post('agentes/:agenteId/conversa')
  criarComAgente(@Req() req: any, @Param('agenteId') agenteId: string) {
    return this.service.criarComAgente(req.user.id, agenteId);
  }

  @Post('conversas')
  criar(@Req() req: any, @Body() dados: any) {
    return this.service.criar(req.user.id, String(dados.usuarioId ?? ''));
  }

  @Get('conversas/:id/mensagens')
  mensagens(@Req() req: any, @Param('id') id: string) {
    return this.service.mensagens(req.user.id, id);
  }

  @Post('conversas/:id/mensagens')
  enviar(@Req() req: any, @Param('id') id: string, @Body() dados: any) {
    return this.service.enviar(req.user.id, id, dados?.texto);
  }
}