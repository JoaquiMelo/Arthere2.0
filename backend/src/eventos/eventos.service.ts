import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { isEventoConcluido } from './evento-data';

const MAX_FOTOS = 8;
const fotoPath = /^\/uploads\/([a-f0-9-]{36}\.(?:jpg|png|webp|gif))$/i;

function fotosPersistidas(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && fotoPath.test(item)) : [];
}

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

  async capasDosAlbuns() {
    const now = new Date();
    const albuns = await this.prisma.eventoAlbum.findMany({
      where: { evento: { dataEvento: { lt: now } } },
      select: { eventoId: true, fotos: true, evento: { select: { dataEvento: true } } },
    });
    return albuns.flatMap((album) => {
      const capa = fotosPersistidas(album.fotos)[0];
      return capa && isEventoConcluido(album.evento.dataEvento, now) ? [{ eventoId: album.eventoId, capa }] : [];
    });
  }

  async fotos(id: string) {
    const evento = await this.prisma.evento.findUnique({ where: { id }, select: { dataEvento: true } });
    if (!evento) throw new NotFoundException('Evento não encontrado.');
    if (!isEventoConcluido(evento.dataEvento)) return [];
    const album = await this.prisma.eventoAlbum.findUnique({ where: { eventoId: id } });
    return fotosPersistidas(album?.fotos);
  }

  async salvarFotos(uid: string, id: string, value: unknown) {
    await this.exigirTipo(uid);
    const contratante = await this.prisma.contratante.findUnique({ where: { usuarioId: uid }, select: { id: true } });
    const evento = await this.prisma.evento.findUnique({ where: { id }, select: { dataEvento: true, contratanteId: true } });
    if (!evento) throw new NotFoundException('Evento não encontrado.');
    if (!contratante || evento.contratanteId !== contratante.id) throw new ForbiddenException('Você não pode gerenciar as fotos deste evento.');
    if (!isEventoConcluido(evento.dataEvento)) throw new ConflictException('O álbum fica disponível depois da data do evento.');
    if (!Array.isArray(value) || value.length > MAX_FOTOS) throw new BadRequestException(`Envie uma lista de até ${MAX_FOTOS} fotos.`);
    const fotos = fotosPersistidas(value);
    if (fotos.length !== value.length || new Set(fotos).size !== fotos.length) {
      throw new BadRequestException('A lista deve conter apenas fotos enviadas pela galeria, sem duplicatas.');
    }
    if (fotos.length) {
      const filenames = fotos.map((foto) => foto.split('/').pop()!);
      const existing = await this.prisma.uploadImagem.count({ where: { filename: { in: filenames } } });
      if (existing !== fotos.length) throw new BadRequestException('Uma ou mais fotos não foram encontradas.');
    }
    await this.prisma.eventoAlbum.upsert({
      where: { eventoId: id }, create: { eventoId: id, fotos }, update: { fotos },
    });
    return fotos;
  }

  async criar(uid: string, dados: any) {
    await this.exigirTipo(uid);
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
        imagemUrl: dados.imagemUrl || null,
        premium: Boolean(dados.premium),
        fixado: Boolean(dados.fixado),
        contratanteId: contratante.id,
      },
    });
  }

  async atualizar(uid: string, id: string, dados: any) {
    await this.exigirTipo(uid);
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
        ...(dados.imagemUrl !== undefined ? { imagemUrl: dados.imagemUrl || null } : {}),
        ...(dados.premium !== undefined ? { premium: Boolean(dados.premium) } : {}),
        ...(dados.fixado !== undefined ? { fixado: Boolean(dados.fixado) } : {}),
      },
    });
  }

  async remover(uid: string, id: string) {
    await this.exigirTipo(uid);
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
    if (isEventoConcluido(evento.dataEvento)) throw new ConflictException('Evento concluído. As solicitações de participação estão encerradas.');

    const existente = await this.prisma.solicitacaoEvento.findUnique({
      where: { agenteId_eventoId: { agenteId: agente.id, eventoId } },
    });
    if (existente) {
      if (existente.status !== 'RECUSADA') {
        throw new ConflictException('Você já possui uma solicitação para este evento.');
      }
      return this.prisma.solicitacaoEvento.update({
        where: { id: existente.id },
        data: { status: 'PENDENTE', mensagem: mensagem?.trim() || null },
        include: { evento: true, agente: true },
      });
    }
    return this.prisma.solicitacaoEvento.create({
      data: { agenteId: agente.id, eventoId, mensagem: mensagem?.trim() || undefined },
      include: { evento: true, agente: true },
    });
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

    if (usuario.contratante && usuario.tipo === 'CONTRATANTE_EVENTOS') {
      return this.prisma.solicitacaoEvento.findMany({
        where: { evento: { contratanteId: usuario.contratante.id } },
        include: { evento: true, agente: { include: { portfolio: true } } },
        orderBy: [{ status: 'asc' }, { criadoEm: 'desc' }],
      });
    }

    throw new ForbiddenException('Administrador não possui solicitações de eventos.');
  }

  async atualizarSolicitacao(uid: string, solicitacaoId: string, status: 'ACEITA' | 'RECUSADA') {
    await this.exigirTipo(uid);
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

  private async exigirTipo(uid: string) {
    const usuario = await this.prisma.usuario.findUnique({ where: { id: uid }, select: { tipo: true } });
    if (!usuario || usuario.tipo !== 'CONTRATANTE_EVENTOS') throw new ForbiddenException('Esta função está disponível apenas para contratantes de eventos.');
  }

  private validar(dados: any) {
    for (const campo of ['titulo', 'descricao', 'categoria', 'local', 'cidade', 'dataEvento']) {
      if (!dados?.[campo]) throw new ConflictException('O campo ' + campo + ' é obrigatório.');
    }
    const data = new Date(dados.dataEvento);
    if (Number.isNaN(data.getTime())) throw new ConflictException('Data do evento inválida.');
  }
}
