import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjetosService {
  constructor(private readonly prisma: PrismaService) {}

  private async exigirTipo(uid: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: uid }, select: { tipo: true } });
    if (!usuario || usuario.tipo !== 'CONTRATANTE_OPORTUNIDADES') throw new ForbiddenException('Esta função está disponível apenas para contratantes de oportunidades.');
  }

  async listar(filtros: { categoria?: string; cidade?: string; busca?: string; status?: string }) {
    const busca = filtros.busca?.trim();
    return this.prisma.projeto.findMany({
      where: {
        ...(filtros.status ? { status: filtros.status as any } : { status: 'ABERTO' }),
        ...(filtros.categoria ? { categoria: { contains: filtros.categoria.trim() } } : {}),
        ...(filtros.cidade ? { contratante: { cidade: { contains: filtros.cidade.trim() } } } : {}),
        ...(busca ? { OR: [
          { titulo: { contains: busca } },
          { descricao: { contains: busca } },
          { categoria: { contains: busca } },
          { contratante: { nome: { contains: busca } } },
          { contratante: { empresa: { contains: busca } } },
        ] } : {}),
      },
      include: { contratante: { select: { id: true, nome: true, nomeSocial: true, empresa: true, avatarUrl: true, cidade: true } } },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async meus(uid: string) {
    await this.exigirTipo(uid);
    const contratante = await this.prisma.contratante.findUnique({ where: { usuarioId: uid } });
    if (!contratante) throw new ForbiddenException('Somente contratantes possuem projetos publicados.');

    return this.prisma.projeto.findMany({
      where: { contratanteId: contratante.id },
      include: {
        contratante: true,
        candidaturas: {
          include: { agente: { include: { portfolio: true } } },
          orderBy: { criadoEm: 'desc' },
        },
      },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async obter(id: string) {
    const projeto = await this.prisma.projeto.findUnique({
      where: { id },
      include: { contratante: true, candidaturas: { include: { agente: { include: { portfolio: true } } }, orderBy: { criadoEm: 'desc' } } },
    });
    if (!projeto) throw new NotFoundException('Projeto não encontrado.');
    return projeto;
  }

  async criar(uid: string, dados: any) {
    await this.exigirTipo(uid);
    const contratante = await this.prisma.contratante.findUnique({ where: { usuarioId: uid } });
    if (!contratante) throw new ForbiddenException('Somente contratantes podem publicar oportunidades.');
    if (!dados.titulo || !dados.descricao || !dados.categoria) throw new ConflictException('Título, descrição e categoria são obrigatórios.');

    return this.prisma.projeto.create({
      data: {
        titulo: String(dados.titulo).trim(),
        descricao: String(dados.descricao).trim(),
        categoria: String(dados.categoria).trim(),
        orcamento: dados.orcamento == null || dados.orcamento === '' ? undefined : Number(dados.orcamento),
        dataEvento: dados.dataEvento ? new Date(dados.dataEvento) : undefined,
        contratanteId: contratante.id,
      },
      include: { contratante: true },
    });
  }

  async atualizar(uid: string, id: string, dados: any) {
    await this.exigirTipo(uid);
    const contratante = await this.prisma.contratante.findUnique({ where: { usuarioId: uid } });
    if (!contratante) throw new ForbiddenException('Somente contratantes podem editar projetos.');
    const projeto = await this.prisma.projeto.findUnique({ where: { id } });
    if (!projeto) throw new NotFoundException('Projeto não encontrado.');
    if (projeto.contratanteId !== contratante.id) throw new ForbiddenException('Você não pode editar este projeto.');

    return this.prisma.projeto.update({
      where: { id },
      data: {
        ...(dados.titulo !== undefined ? { titulo: String(dados.titulo).trim() } : {}),
        ...(dados.descricao !== undefined ? { descricao: String(dados.descricao).trim() } : {}),
        ...(dados.categoria !== undefined ? { categoria: String(dados.categoria).trim() } : {}),
        ...(dados.status !== undefined ? { status: dados.status } : {}),
        ...(dados.orcamento !== undefined ? { orcamento: dados.orcamento == null || dados.orcamento === '' ? null : Number(dados.orcamento) } : {}),
        ...(dados.dataEvento !== undefined ? { dataEvento: dados.dataEvento ? new Date(dados.dataEvento) : null } : {}),
      },
      include: { contratante: true },
    });
  }

  async candidatar(uid: string, projetoId: string, mensagem?: string) {
    const agente = await this.prisma.agenteCriativo.findUnique({ where: { usuarioId: uid } });
    if (!agente) throw new ForbiddenException('Somente agentes criativos podem se candidatar.');
    const projeto = await this.prisma.projeto.findUnique({ where: { id: projetoId } });
    if (!projeto || projeto.status !== 'ABERTO') throw new NotFoundException('Oportunidade não está disponível.');

    try {
      return await this.prisma.candidatura.create({
        data: { agenteId: agente.id, projetoId, mensagem: mensagem?.trim() || undefined },
        include: { projeto: true },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('Você já se candidatou a esta oportunidade.');
      throw error;
    }
  }

  async minhasCandidaturas(uid: string) {
    const agente = await this.prisma.agenteCriativo.findUnique({ where: { usuarioId: uid } });
    if (!agente) throw new ForbiddenException('Somente agentes possuem candidaturas.');
    return this.prisma.candidatura.findMany({
      where: { agenteId: agente.id },
      include: { projeto: { include: { contratante: true } } },
      orderBy: { criadoEm: 'desc' },
    });
  }

  async candidaturasDoProjeto(uid: string, projetoId: string) {
    await this.exigirTipo(uid);
    const contratante = await this.prisma.contratante.findUnique({ where: { usuarioId: uid } });
    if (!contratante) throw new ForbiddenException('Somente contratantes podem visualizar candidaturas.');
    const projeto = await this.prisma.projeto.findUnique({ where: { id: projetoId } });
    if (!projeto) throw new NotFoundException('Projeto não encontrado.');
    if (projeto.contratanteId !== contratante.id) throw new ForbiddenException('Acesso negado.');

    return this.prisma.candidatura.findMany({
      where: { projetoId },
      include: { agente: { include: { portfolio: true } } },
      orderBy: [{ status: 'asc' }, { criadoEm: 'desc' }],
    });
  }

  async atualizarCandidatura(uid: string, candidaturaId: string, status: 'ACEITA' | 'RECUSADA') {
    await this.exigirTipo(uid);
    const contratante = await this.prisma.contratante.findUnique({ where: { usuarioId: uid } });
    if (!contratante) throw new ForbiddenException('Somente contratantes podem avaliar candidaturas.');
    if (status !== 'ACEITA' && status !== 'RECUSADA') throw new ConflictException('Status de candidatura inválido.');

    const candidatura = await this.prisma.candidatura.findUnique({ where: { id: candidaturaId }, include: { projeto: true } });
    if (!candidatura) throw new NotFoundException('Candidatura não encontrada.');
    if (candidatura.projeto.contratanteId !== contratante.id) throw new ForbiddenException('Acesso negado.');

    return this.prisma.$transaction(async (tx) => {
      if (status === 'ACEITA') {
        const aceitaExistente = await tx.candidatura.findFirst({
          where: { projetoId: candidatura.projetoId, status: 'ACEITA', id: { not: candidaturaId } },
        });
        if (aceitaExistente) throw new ConflictException('Este projeto já possui uma candidatura aceita.');
      }

      const antesAceita = candidatura.status === 'ACEITA';
      const atualizada = await tx.candidatura.update({ where: { id: candidaturaId }, data: { status } });

      if (!antesAceita && status === 'ACEITA') {
        await tx.agenteCriativo.update({ where: { id: candidatura.agenteId }, data: { totalProjetos: { increment: 1 } } });
      }
      if (antesAceita && status !== 'ACEITA') {
        await tx.agenteCriativo.update({ where: { id: candidatura.agenteId }, data: { totalProjetos: { decrement: 1 } } });
      }

      return atualizada;
    });
  }
}
