import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class ProjetosService {
  constructor(private prisma: PrismaService) {}
  listar(filtros: { categoria?: string; cidade?: string; busca?: string }) {
    const AND: any[] = [{ status: 'ABERTO' }];
    if (filtros.categoria) AND.push({ categoria: { contains: filtros.categoria } });
    if (filtros.cidade) AND.push({ contratante: { cidade: { contains: filtros.cidade } } });
    if (filtros.busca) AND.push({ OR: [{ titulo: { contains: filtros.busca } }, { descricao: { contains: filtros.busca } }] });
    return this.prisma.projeto.findMany({ where: { AND }, include: { contratante: { select: { id: true, nome: true, nomeSocial: true, empresa: true, avatarUrl: true, cidade: true } } }, orderBy: { criadoEm: 'desc' } });
  }
  async buscar(id: string) {
    const projeto = await this.prisma.projeto.findUnique({ where: { id }, include: { contratante: true, candidaturas: { include: { agente: { select: { id: true, nome: true, especialidade: true, avatarUrl: true, notaMedia: true } } } } } });
    if (!projeto) throw new NotFoundException('Projeto não encontrado.');
    return projeto;
  }
  async criar(uid: string, d: any) {
    const c = await this.prisma.contratante.findUnique({ where: { usuarioId: uid } });
    if (!c) throw new ForbiddenException('Somente contratantes podem publicar oportunidades.');
    if (!d.titulo || !d.descricao || !d.categoria) throw new ConflictException('Título, descrição e categoria são obrigatórios.');
    return this.prisma.projeto.create({ data: { titulo: d.titulo.trim(), descricao: d.descricao.trim(), categoria: d.categoria.trim(), orcamento: d.orcamento == null ? undefined : Number(d.orcamento), dataEvento: d.dataEvento ? new Date(d.dataEvento) : undefined, contratanteId: c.id } });
  }
  async atualizar(uid: string, id: string, d: any) {
    const c = await this.prisma.contratante.findUnique({ where: { usuarioId: uid } });
    const p = await this.prisma.projeto.findUnique({ where: { id } });
    if (!c || !p || p.contratanteId !== c.id) throw new ForbiddenException('Sem permissão.');
    return this.prisma.projeto.update({ where: { id }, data: { titulo: d.titulo?.trim(), descricao: d.descricao?.trim(), categoria: d.categoria?.trim(), status: d.status, orcamento: d.orcamento == null ? undefined : Number(d.orcamento), dataEvento: d.dataEvento ? new Date(d.dataEvento) : undefined } });
  }
  async candidatar(uid: string, pid: string, mensagem?: string) {
    const a = await this.prisma.agenteCriativo.findUnique({ where: { usuarioId: uid } });
    if (!a) throw new ForbiddenException('Somente agentes criativos podem se candidatar.');
    const p = await this.prisma.projeto.findUnique({ where: { id: pid } });
    if (!p || p.status !== 'ABERTO') throw new NotFoundException('Oportunidade não está disponível.');
    try { return await this.prisma.candidatura.create({ data: { agenteId: a.id, projetoId: pid, mensagem: mensagem?.trim() || undefined } }); }
    catch (e: any) { if (e?.code === 'P2002') throw new ConflictException('Você já se candidatou a esta oportunidade.'); throw e; }
  }
  minhasCandidaturas(uid: string) {
    return this.prisma.candidatura.findMany({ where: { agente: { usuarioId: uid } }, include: { projeto: { include: { contratante: { select: { id: true, nome: true, empresa: true, cidade: true } } } } }, orderBy: { criadoEm: 'desc' } });
  }
  candidaturasDoProjeto(uid: string, projetoId: string) {
    return this.prisma.candidatura.findMany({ where: { projetoId, projeto: { contratante: { usuarioId: uid } } }, include: { agente: { include: { portfolio: true } } }, orderBy: { criadoEm: 'desc' } });
  }
  async alterarCandidatura(uid: string, id: string, status: 'ACEITA' | 'RECUSADA') {
    const c = await this.prisma.candidatura.findUnique({ where: { id }, include: { projeto: { include: { contratante: true } }, agente: true } });
    if (!c || c.projeto.contratante.usuarioId !== uid) throw new ForbiddenException('Sem permissão.');
    const updated = await this.prisma.candidatura.update({ where: { id }, data: { status } });
    if (status === 'ACEITA') await this.prisma.agenteCriativo.update({ where: { id: c.agenteId }, data: { totalProjetos: { increment: 1 } } });
    return updated;
  }
}