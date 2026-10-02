import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async meuPerfil(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      include: {
        agente: { include: { portfolio: { orderBy: { criadoEm: 'desc' } } } },
        contratante: true,
      },
    });
    if (!usuario) throw new NotFoundException('Usuário não encontrado.');
    return { id: usuario.id, email: usuario.email, tipo: usuario.tipo, perfil: usuario.agente ?? usuario.contratante };
  }

  async listarAgentes(filtros: { cidade?: string; especialidade?: string; busca?: string }) {
    const busca = filtros.busca?.trim();
    return this.prisma.agenteCriativo.findMany({
      where: {
        visivelMapa: true,
        usuario: { is: {} },
        ...(filtros.cidade ? { cidade: { contains: filtros.cidade.trim() } } : {}),
        ...(filtros.especialidade ? { especialidade: { contains: filtros.especialidade.trim() } } : {}),
        ...(busca ? { OR: [
          { nome: { contains: busca } },
          { especialidade: { contains: busca } },
          { bio: { contains: busca } },
          { cidade: { contains: busca } },
        ] } : {}),
      },
      include: { portfolio: { orderBy: { criadoEm: 'desc' } } },
      orderBy: [{ notaMedia: 'desc' }, { nome: 'asc' }],
    });
  }

  async atualizarMeuPerfil(id: string, tipo: string, dados: any) {
    if (tipo === 'AGENTE') {
      const coordenada = (valor: unknown, limite: number, nome: string) => {
        if (valor == null || valor === '') return null;
        const n = Number(valor);
        if (!Number.isFinite(n) || Math.abs(n) > limite) throw new BadRequestException(nome + ' inválida.');
        return n;
      };
      const atual = await this.prisma.agenteCriativo.findUnique({ where: { usuarioId: id } });
      if (!atual) throw new NotFoundException('Perfil de agente não encontrado.');
      const latFinal = dados.latitude !== undefined ? coordenada(dados.latitude, 90, 'Latitude') : atual.latitude;
      const lngFinal = dados.longitude !== undefined ? coordenada(dados.longitude, 180, 'Longitude') : atual.longitude;
      const visivelFinal = dados.visivelNoMapa !== undefined ? Boolean(dados.visivelNoMapa) : atual.visivelMapa;
      if ((latFinal == null) !== (lngFinal == null)) throw new BadRequestException('Informe latitude e longitude juntas.');
      if (visivelFinal && latFinal == null) throw new BadRequestException('Escolha o local no mapa para aparecer nele.');

      const perfil = await this.prisma.agenteCriativo.update({
        where: { usuarioId: id },
        data: {
          ...(dados.nome !== undefined ? { nome: String(dados.nome).trim() } : {}),
          ...(dados.especialidade !== undefined ? { especialidade: String(dados.especialidade).trim() } : {}),
          ...(dados.bio !== undefined ? { bio: dados.bio ? String(dados.bio).trim() : null } : {}),
          ...(dados.estado !== undefined ? { estado: String(dados.estado).trim() } : {}),
          ...(dados.cidade !== undefined ? { cidade: String(dados.cidade).trim() } : {}),
          ...(dados.endereco !== undefined ? { endereco: String(dados.endereco).trim() } : {}),
          ...(dados.avatarUrl !== undefined ? { avatarUrl: dados.avatarUrl || null } : {}),
          ...(dados.visivelNoMapa !== undefined ? { visivelMapa: Boolean(dados.visivelNoMapa) } : {}),
          ...(dados.latitude !== undefined ? { latitude: latFinal } : {}),
          ...(dados.longitude !== undefined ? { longitude: lngFinal } : {}),
        },
      });
      return { perfil };
    }

    if (tipo === 'CONTRATANTE') {
      if (dados.cpfCnpj) {
        const outro = await this.prisma.contratante.findFirst({
          where: { cpfCnpj: String(dados.cpfCnpj).trim(), NOT: { usuarioId: id } },
        });
        if (outro) throw new ConflictException('CPF/CNPJ já cadastrado.');
      }

      const perfil = await this.prisma.contratante.update({
        where: { usuarioId: id },
        data: {
          ...(dados.nome !== undefined ? { nome: String(dados.nome).trim() } : {}),
          ...(dados.nomeSocial !== undefined ? { nomeSocial: dados.nomeSocial ? String(dados.nomeSocial).trim() : null } : {}),
          ...(dados.pronomes !== undefined ? { pronomes: dados.pronomes ? String(dados.pronomes).trim() : null } : {}),
          ...(dados.cpfCnpj !== undefined ? { cpfCnpj: dados.cpfCnpj ? String(dados.cpfCnpj).trim() : null } : {}),
          ...(dados.empresa !== undefined ? { empresa: dados.empresa ? String(dados.empresa).trim() : null } : {}),
          ...(dados.telefone !== undefined ? { telefone: dados.telefone ? String(dados.telefone).trim() : null } : {}),
          ...(dados.descricao !== undefined ? { descricao: dados.descricao ? String(dados.descricao).trim() : null } : {}),
          ...(dados.site !== undefined ? { site: dados.site ? String(dados.site).trim() : null } : {}),
          ...(dados.estado !== undefined ? { estado: dados.estado ? String(dados.estado).trim() : null } : {}),
          ...(dados.cidade !== undefined ? { cidade: dados.cidade ? String(dados.cidade).trim() : null } : {}),
          ...(dados.endereco !== undefined ? { endereco: dados.endereco ? String(dados.endereco).trim() : null } : {}),
          ...(dados.categoria !== undefined ? { categoria: dados.categoria ? String(dados.categoria).trim() : null } : {}),
          ...(dados.avatarUrl !== undefined ? { avatarUrl: dados.avatarUrl || null } : {}),
        },
      });
      return { perfil };
    }

    throw new ForbiddenException('Administradores não possuem perfil público.');
  }
}
