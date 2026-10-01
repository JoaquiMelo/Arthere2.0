import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class PortfolioService {
  constructor(private prisma: PrismaService) {}
  listar(agenteId: string) { return this.prisma.portfolio.findMany({ where: { agenteId }, orderBy: { criadoEm: 'desc' } }); }
  async criar(usuarioId: string, d: any) {
    const agente = await this.prisma.agenteCriativo.findUnique({ where: { usuarioId } });
    if (!agente) throw new ForbiddenException('Somente agentes criativos possuem portfólio.');
    if (!d.imageUrl?.trim()) throw new ForbiddenException('imageUrl é obrigatório.');
    return this.prisma.portfolio.create({ data: { agenteId: agente.id, imageUrl: d.imageUrl.trim(), titulo: d.titulo?.trim(), descricao: d.descricao?.trim() } });
  }
  async atualizar(usuarioId: string, id: string, d: any) {
    const item = await this.prisma.portfolio.findUnique({ where: { id }, include: { agente: true } });
    if (!item) throw new NotFoundException('Item do portfólio não encontrado.');
    if (item.agente.usuarioId !== usuarioId) throw new ForbiddenException('Sem permissão.');
    return this.prisma.portfolio.update({ where: { id }, data: { imageUrl: d.imageUrl?.trim(), titulo: d.titulo?.trim(), descricao: d.descricao?.trim() } });
  }
  async remover(usuarioId: string, id: string) {
    const item = await this.prisma.portfolio.findUnique({ where: { id }, include: { agente: true } });
    if (!item) throw new NotFoundException('Item do portfólio não encontrado.');
    if (item.agente.usuarioId !== usuarioId) throw new ForbiddenException('Sem permissão.');
    return this.prisma.portfolio.delete({ where: { id } });
  }
}