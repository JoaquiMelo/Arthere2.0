import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async meuPerfil(id: string) {
    const u = await this.prisma.usuario.findUnique({
      where: { id },
      include: { agente: { include: { portfolio: true } }, contratante: true },
    });
    if (!u) throw new NotFoundException('Usuário não encontrado.');
    return { id: u.id, email: u.email, tipo: u.tipo, perfil: u.agente ?? u.contratante };
  }

  async atualizarMeuPerfil(id: string, tipo: string, d: any) {
    if (tipo === 'AGENTE') {
      const perfil = await this.prisma.agenteCriativo.update({
        where: { usuarioId: id },
        data: {
          nome: d.nome?.trim(),
          especialidade: d.especialidade?.trim(),
          bio: d.bio?.trim(),
          cidade: d.cidade?.trim(),
          endereco: d.endereco?.trim(),
          avatarUrl: d.avatarUrl,
          visivelMapa: d.visivelNoMapa ?? d.visivelMapa,
          latitude: d.latitude == null ? undefined : Number(d.latitude),
          longitude: d.longitude == null ? undefined : Number(d.longitude),
        },
      });
      return { perfil };
    }
    if (tipo === 'CONTRATANTE') {
      const perfil = await this.prisma.contratante.update({
        where: { usuarioId: id },
        data: {
          nome: d.nome?.trim(),
          nomeSocial: d.nomeSocial?.trim(),
          pronomes: d.pronomes?.trim(),
          cpfCnpj: d.cpfCnpj?.trim(),
          empresa: d.empresa?.trim(),
          telefone: d.telefone?.trim(),
          descricao: d.descricao?.trim(),
          site: d.site?.trim(),
          cidade: d.cidade?.trim(),
          endereco: d.endereco?.trim(),
          categoria: d.categoria?.trim(),
          avatarUrl: d.avatarUrl,
        },
      });
      return { perfil };
    }
    throw new ForbiddenException('Administradores não possuem perfil público.');
  }

  listarAgentes(filtros: { cidade?: string; especialidade?: string; busca?: string }) {
    const AND: any[] = [];
    if (filtros.cidade) AND.push({ cidade: { contains: filtros.cidade } });
    if (filtros.especialidade) AND.push({ especialidade: { contains: filtros.especialidade } });
    if (filtros.busca) AND.push({
      OR: [
        { nome: { contains: filtros.busca } },
        { especialidade: { contains: filtros.busca } },
        { bio: { contains: filtros.busca } },
      ],
    });
    return this.prisma.agenteCriativo.findMany({
      where: AND.length ? { AND, visivelMapa: true } : { visivelMapa: true },
      orderBy: [{ notaMedia: 'desc' }, { criadoEm: 'desc' }],
      select: {
        id: true, nome: true, especialidade: true, bio: true, cidade: true,
        latitude: true, longitude: true, visivelMapa: true, avatarUrl: true,
        notaMedia: true, totalAvaliacoes: true, totalProjetos: true,
      },
    });
  }
}