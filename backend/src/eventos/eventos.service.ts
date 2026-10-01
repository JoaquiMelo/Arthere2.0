import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class EventosService {
  constructor(private prisma: PrismaService) {}
  listar(filtros: { cidade?: string; categoria?: string; busca?: string }) {
    const AND: any[] = [];
    if (filtros.cidade) AND.push({ cidade: { contains: filtros.cidade } });
    if (filtros.categoria) AND.push({ categoria: { contains: filtros.categoria } });
    if (filtros.busca) AND.push({ OR: [{ titulo: { contains: filtros.busca } }, { descricao: { contains: filtros.busca } }, { local: { contains: filtros.busca } }] });
    return this.prisma.evento.findMany({ where: AND.length ? { AND } : undefined, orderBy: [{ fixado: 'desc' }, { premium: 'desc' }, { dataEvento: 'asc' }] });
  }
  async buscar(id: string) {
    const evento = await this.prisma.evento.findUnique({ where: { id } });
    if (!evento) throw new NotFoundException('Evento não encontrado.');
    return evento;
  }
  async criar(usuarioId: string, d: any) {
    const c = await this.prisma.contratante.findUnique({ where: { usuarioId } });
    if (!c) throw new ForbiddenException('Somente contratantes podem cadastrar eventos.');
    if (!d.titulo || !d.descricao || !d.categoria || !d.local || !d.cidade || !d.dataEvento || !d.horario) throw new ForbiddenException('Preencha os campos obrigatórios do evento.');
    const dataEvento = new Date(d.dataEvento);
    if (Number.isNaN(dataEvento.getTime())) throw new ForbiddenException('dataEvento inválida.');
    return this.prisma.evento.create({ data: { titulo: d.titulo.trim(), descricao: d.descricao.trim(), categoria: d.categoria.trim(), local: d.local.trim(), cidade: d.cidade.trim(), dataEvento, horario: d.horario.trim(), organizador: d.organizador?.trim() || c.nome, premium: Boolean(d.premium), fixado: Boolean(d.fixado), contratanteId: c.id } });
  }
  async atualizar(usuarioId: string, id: string, d: any) {
    const c = await this.prisma.contratante.findUnique({ where: { usuarioId } });
    if (!c) throw new ForbiddenException('Sem permissão.');
    const evento = await this.buscar(id);
    if (evento.contratanteId !== c.id) throw new ForbiddenException('Sem permissão.');
    const dataEvento = d.dataEvento ? new Date(d.dataEvento) : undefined;
    if (dataEvento && Number.isNaN(dataEvento.getTime())) throw new ForbiddenException('dataEvento inválida.');
    return this.prisma.evento.update({ where: { id }, data: { titulo: d.titulo?.trim(), descricao: d.descricao?.trim(), categoria: d.categoria?.trim(), local: d.local?.trim(), cidade: d.cidade?.trim(), dataEvento, horario: d.horario?.trim(), organizador: d.organizador?.trim(), premium: d.premium == null ? undefined : Boolean(d.premium), fixado: d.fixado == null ? undefined : Boolean(d.fixado) } });
  }
  async remover(usuarioId: string, id: string) {
    const c = await this.prisma.contratante.findUnique({ where: { usuarioId } });
    if (!c) throw new ForbiddenException('Sem permissão.');
    const evento = await this.buscar(id);
    if (evento.contratanteId !== c.id) throw new ForbiddenException('Sem permissão.');
    return this.prisma.evento.delete({ where: { id } });
  }
}