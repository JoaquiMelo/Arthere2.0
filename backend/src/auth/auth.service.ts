import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService, private readonly jwt: JwtService) {}

  async register(dto: RegisterDto) {
    const tipo = dto.tipo;
    if (tipo !== 'AGENTE' && tipo !== 'CONTRATANTE_EVENTOS' && tipo !== 'CONTRATANTE_OPORTUNIDADES') throw new ConflictException('Tipo de usuário inválido.');

    const email = String(dto.email ?? '').trim().toLowerCase();
    const nome = String(dto.nome ?? '').trim();
    const senha = String(dto.senha ?? '');

    if (!email || !nome) throw new ConflictException('Nome e e-mail são obrigatórios.');
    if (!this.emailValido(email)) throw new ConflictException('Informe um e-mail válido.');
    if (senha.length < 8) throw new ConflictException('A senha deve ter pelo menos 8 caracteres.');

    const existente = await this.prisma.usuario.findUnique({ where: { email } });
    if (existente) throw new ConflictException('E-mail já cadastrado.');

    // O perfil de oportunidades é de pessoa física e não exige vínculo empresarial.
    // CPF/CNPJ é validado apenas para contratantes que representam organizações em eventos.
    if (tipo === 'CONTRATANTE_EVENTOS' && dto.cpfCnpj) {
      const documento = dto.cpfCnpj.trim();
      const porDocumento = await this.prisma.contratante.findUnique({ where: { cpfCnpj: documento } });
      if (porDocumento) throw new ConflictException('CPF/CNPJ já cadastrado.');
    }

    const senhaHash = await bcrypt.hash(senha, 12);

    const usuario = await this.prisma.usuario.create({
      data: {
        email,
        senha: senhaHash,
        tipo,
        ...(tipo === 'AGENTE'
          ? {
              agente: {
                create: {
                  nome,
                  especialidade: dto.especialidade?.trim() ?? '',
                  bio: dto.descricao?.trim() || undefined,
                  estado: dto.estado?.trim() ?? '',
                  cidade: dto.cidade?.trim() ?? '',
                  endereco: dto.endereco?.trim() ?? '',
                },
              },
            }
          : {
              contratante: {
                create: {
                  nome,
                  nomeSocial: dto.nomeSocial?.trim() || undefined,
                  pronomes: dto.pronomes?.trim() || undefined,
                  cpfCnpj: tipo === 'CONTRATANTE_EVENTOS' ? dto.cpfCnpj?.trim() || undefined : undefined,
                  empresa: tipo === 'CONTRATANTE_EVENTOS' ? dto.empresa?.trim() || undefined : undefined,
                  telefone: dto.telefone?.trim() || undefined,
                  descricao: dto.descricao?.trim() || undefined,
                  site: tipo === 'CONTRATANTE_EVENTOS' ? dto.site?.trim() || undefined : undefined,
                  estado: dto.estado?.trim() || undefined,
                  cidade: dto.cidade?.trim() || undefined,
                  endereco: dto.endereco?.trim() || undefined,
                  categoria: dto.categoria?.trim() || undefined,
                },
              },
            }),
      },
      include: { agente: true, contratante: true },
    });

    return this.token(usuario);
  }

  async login(dto: LoginDto) {
    const email = String(dto.email ?? '').trim().toLowerCase();
    if (!this.emailValido(email)) throw new UnauthorizedException('Informe um e-mail válido.');
    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
      include: { agente: true, contratante: true },
    });

    if (!usuario || !(await bcrypt.compare(String(dto.senha ?? ''), usuario.senha))) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    return this.token(usuario);
  }

  private emailValido(email: string) {
    return /^[^\s@]+@[^\s@]+$/i.test(email);
  }

  private token(usuario: any) {
    return {
      access_token: this.jwt.sign({ sub: usuario.id, email: usuario.email, tipo: usuario.tipo }),
      usuario: {
        id: usuario.id,
        email: usuario.email,
        tipo: usuario.tipo,
        perfil: usuario.agente ?? usuario.contratante,
      },
    };
  }
}
