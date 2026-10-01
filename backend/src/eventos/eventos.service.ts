import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class EventosService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(filtros: { cidade?: string; categoria?: string; busca?: string }) {
    const busca = filtros.busca?.trim();
    return this.prisma.evento.findMany({
      where: {
        ...(filtros.cidade ? { cidade: { contains: filtros.cidade.trim() } } : {}),
        ...(filtros.categoria ? { categoria: { contains: filtros.categoria.trim() } } : {}),
        ...(busca ? { OR: [
          { titulo: { contains: busca } },
          { descricao: { contains: busca } },
          { categoria: { contains: busca } },
          { local: { contains: busca } },
          { cidade: { contains: busca } },
        ] } : {}),
      },
      orderBy: [{ fixado: 'desc' }, { premium: 'desc' }, { dataEvento: 'asc' }],
    });
  }

  async obter(id: string) {
    const evento = await this.prisma.evento.findUnique({
      where: { id },
      include: { contratante: true },
    });
    if (!evento) throw new NotFoundException('Evento não encontrado.');
    return evento;
  }

  async criar(uid: string, dados: any) {
    const contratante = await this.prisma.contratante.findUnique({ where: { usuarioId: uid } });
    if (!contratante) throw new ForbiddenException('Somente contratantes podem cadastrar eventos.');
    this.validar(dados);
    return this.prisma.evento.create({
      data: {
        titulo: String(dados.titulo).trim(),
        descricao: String(dados.descricao).trim(),
        categoria: String(dados.categoria).trim(),
        local: String(dados.local).trim(),
        cidade: String(dados.cidade).trim(),
        dataEvento: new Date(dados.dataEvento),
        horario: dados.horario?.trim() || undefined,
        organizador: dados.organizador?.trim() || contratante.nome,
        premium: Boolean(dados.premium),
        fixado: Boolean(dados.fixado),
        contratanteId: contratante.id,
      },
    });
  }

  async atualizar(uid: string, id: string, dados: any) {
    const contratante = await this.prisma.contratante.findUnique({ where: { usuarioId: uid } });
    if (!contratante) throw new ForbiddenException('Somente contratantes podem editar eventos.');
    const evento = await this.prisma.evento.findUnique({ where: { id } });
    if (!evento) throw new NotFoundException('Evento não encontrado.');
    if (evento.contratanteId !== contratante.id) throw new ForbiddenException('Você não pode editar este evento.');

    return this.prisma.evento.update({
      where: { id },
      data: {
        ...(dados.titulo !== undefined ? { titulo: String(dados.titulo).trim() } : {}),
        ...(dados.descricao !== undefined ? { descricao: String(dados.descricao).trim() } : {}),
        ...(dados.categoria !== undefined ? { categoria: String(dados.categoria).trim() } : {}),
        ...(dados.local !== undefined ? { local: String(dados.local).trim() } : {}),
        ...(dados.cidade !== undefined ? { cidade: String(dados.cidade).trim() } : {}),
        ...(dados.dataEvento !== undefined ? { dataEvento: new Date(dados.dataEvento) } : {}),
        ...(dados.horario !== undefined ? { horario: dados.horario?.trim() || null } : {}),
        ...(dados.organizador !== undefined ? { organizador: dados.organizador?.trim() || null } : {}),
        ...(dados.premium !== undefined ? { premium: Boolean(dados.premium) } : {}),
        ...(dados.fixado !== undefined ? { fixado: Boolean(dados.fixado) } : {}),
      },
    });
  }

  async remover(uid: string, id: string) {
    const contratante = await this.prisma.contratante.findUnique({ where: { usuarioId: uid } });
    if (!contratante) throw new ForbiddenException('Somente contratantes podem remover eventos.');
    const evento = await this.prisma.evento.findUnique({ where: { id } });
    if (!evento) throw new NotFoundException('Evento não encontrado.');
    if (evento.contratanteId !== contratante.id) throw new ForbiddenException('Você não pode remover este evento.');
    return this.prisma.evento.delete({ where: { id } });
  }

  async solicitarParticipacao(uid: string, eventoId: string, mensagem?: string) {
    const agente = await this.prisma.agenteCriativo.findUnique({ where: { usuarioId: uid } });
    if (!agente) throw new ForbiddenException('Somente agentes criativos podem solicitar participação.');
    const evento = await this.prisma.evento.findUnique({ where: { id: eventoId } });
    if (!evento) throw new NotFoundException('Evento não encontrado.');
    if (!evento.contratanteId) throw new ConflictException('Este evento não possui um contratante responsável para receber solicitações.');

    try {
      return await this.prisma.solicitacaoEvento.create({
        data: { agenteId: agente.id, eventoId, mensagem: mensagem?.trim() || undefined },
        include: { evento: true, agente: true },
      });
    } catch (error: any) {
      if (error?.code === 'P2002') throw new ConflictException('Você já enviou uma solicitação para este evento.');
      throw error;
    }
  }

  async minhasSolicitacoes(uid: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: uid },
      include: { agente: true, contratante: true },
    });
    if (!usuario) throw new NotFoundException('Usuário não encontrado.');

    if (usuario.agente) {
      return this.prisma.solicitacaoEvento.findMany({
        where: { agenteId: usuario.agente.id },
        include: { evento: { include: { contratante: true } }, agente: true },
        orderBy: { criadoEm: 'desc' },
      });
    }

    if (usuario.contratante) {
      return this.prisma.solicitacaoEvento.findMany({
        where: { evento: { contratanteId: usuario.contratante.id } },
        include: { evento: true, agente: { include: { portfolio: true } } },
        orderBy: [{ status: 'asc' }, { criadoEm: 'desc' }],
      });
    }

    throw new ForbiddenException('Administrador não possui solicitações de eventos.');
  }

  async atualizarSolicitacao(uid: string, solicitacaoId: string, status: 'ACEITA' | 'RECUSADA') {
    const contratante = await this.prisma.contratante.findUnique({ where: { usuarioId: uid } });
    if (!contratante) throw new ForbiddenException('Somente contratantes podem responder solicitações.');
    if (!['ACEITA', 'RECUSADA'].includes(status)) throw new ConflictException('Status de solicitação inválido.');

    const solicitacao = await this.prisma.solicitacaoEvento.findUnique({
      where: { id: solicitacaoId },
      include: { evento: true },
    });
    if (!solicitacao) throw new NotFoundException('Solicitação não encontrada.');
    if (solicitacao.evento.contratanteId !== contratante.id) throw new ForbiddenException('Você não pode responder esta solicitação.');

    return this.prisma.solicitacaoEvento.update({
      where: { id: solicitacaoId },
      data: { status },
      include: { evento: true, agente: true },
    });
  }

  private validar(dados: any) {
    for (const campo of ['titulo', 'descricao', 'categoria', 'local', 'cidade', 'dataEvento']) {
      if (!dados?.[campo]) throw new ConflictException('O campo ' + campo + ' é obrigatório.');
    }
    const data = new Date(dados.dataEvento);
    if (Number.isNaN(data.getTime())) throw new ConflictException('Data do evento inválida.');
  }
}
