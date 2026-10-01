import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(private readonly prisma: PrismaService) {}

  private async garantirUsuarios(usuarioAId: string, usuarioBId: string) {
    if (usuarioAId === usuarioBId) {
      throw new ConflictException('Não é possível iniciar uma conversa com você mesmo.');
    }
    const usuarios = await this.prisma.usuario.findMany({
      where: { id: { in: [usuarioAId, usuarioBId] } },
      select: { id: true },
    });
    if (usuarios.length !== 2) throw new NotFoundException('Usuário da conversa não encontrado.');
  }

  async criar(uid: string, alvoId: string) {
    await this.garantirUsuarios(uid, alvoId);
    const [usuarioAId, usuarioBId] = [uid, alvoId].sort();

    return this.prisma.conversa.upsert({
      where: { usuarioAId_usuarioBId: { usuarioAId, usuarioBId } },
      update: {},
      create: { usuarioAId, usuarioBId },
      include: {
        usuarioA: { include: { agente: true, contratante: true } },
        usuarioB: { include: { agente: true, contratante: true } },
        mensagens: { orderBy: { criadoEm: 'asc' }, take: 50 },
      },
    });
  }

  async criarComAgente(uid: string, agenteId: string) {
    const agente = await this.prisma.agenteCriativo.findUnique({ where: { id: agenteId }, select: { usuarioId: true } });
    if (!agente) throw new NotFoundException('Agente não encontrado.');
    return this.criar(uid, agente.usuarioId);
  }

  async listar(uid: string) {
    return this.prisma.conversa.findMany({
      where: { OR: [{ usuarioAId: uid }, { usuarioBId: uid }] },
      orderBy: { atualizadoEm: 'desc' },
      include: {
        usuarioA: { include: { agente: true, contratante: true } },
        usuarioB: { include: { agente: true, contratante: true } },
        mensagens: { orderBy: { criadoEm: 'desc' }, take: 50 },
      },
    });
  }

  private async obterParticipante(uid: string, conversaId: string) {
    const conversa = await this.prisma.conversa.findUnique({ where: { id: conversaId } });
    if (!conversa) throw new NotFoundException('Conversa não encontrada.');
    if (conversa.usuarioAId !== uid && conversa.usuarioBId !== uid) {
      throw new ForbiddenException('Você não participa desta conversa.');
    }
    return conversa;
  }

  async mensagens(uid: string, conversaId: string) {
    await this.obterParticipante(uid, conversaId);
    return this.prisma.mensagem.findMany({
      where: { conversaId },
      orderBy: { criadoEm: 'asc' },
    });
  }

  async enviar(uid: string, conversaId: string, texto: string) {
    const conversa = await this.obterParticipante(uid, conversaId);
    const mensagem = String(texto ?? '').trim();
    if (!mensagem) throw new ConflictException('A mensagem não pode estar vazia.');
    if (mensagem.length > 2000) throw new ConflictException('A mensagem deve ter no máximo 2000 caracteres.');

    const [criada] = await this.prisma.$transaction([
      this.prisma.mensagem.create({
        data: { texto: mensagem, conversaId, remetenteId: uid },
      }),
      this.prisma.conversa.update({
        where: { id: conversa.id },
        data: {},
      }),
    ]);

    return criada;
  }
}
