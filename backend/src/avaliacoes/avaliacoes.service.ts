import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class AvaliacoesService {
  constructor(private prisma: PrismaService) {}
  listarAgente(agenteId: string) { return this.prisma.avaliacao.findMany({ where: { agenteId }, include: { contratante: { select: { id: true, nome: true, nomeSocial: true, empresa: true, avatarUrl: true } } }, orderBy: { criadoEm: 'desc' } }); }
  async criar(usuarioId: string, agenteId: string, nota: number, comentario?: string) {
    if (!Number.isInteger(nota) || nota < 1 || nota > 5) throw new ConflictException('A nota deve ser um número inteiro de 1 a 5.');
    const contratante = await this.prisma.contratante.findUnique({ where: { usuarioId } });
    if (!contratante) throw new ForbiddenException('Somente contratantes podem avaliar agentes.');
    const agente = await this.prisma.agenteCriativo.findUnique({ where: { id: agenteId } });
    if (!agente) throw new NotFoundException('Agente não encontrado.');
    if (await this.prisma.avaliacao.findFirst({ where: { agenteId, contratanteId: contratante.id } })) throw new ConflictException('Você já avaliou este agente.');
    return this.prisma.$transaction(async tx => {
      const avaliacao = await tx.avaliacao.create({ data: { agenteId, contratanteId: contratante.id, nota, comentario: comentario?.trim() } });
      const total = agente.totalAvaliacoes + 1;
      await tx.agenteCriativo.update({ where: { id: agenteId }, data: { totalAvaliacoes: total, notaMedia: (agente.notaMedia * agente.totalAvaliacoes + nota) / total } });
      return avaliacao;
    });
  }
}