import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto, RegisterDto } from './auth.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}
  async register(dto: RegisterDto) {
    if (dto.tipo !== 'AGENTE' && dto.tipo !== 'CONTRATANTE') throw new ConflictException('Tipo de usuário inválido.');
    if (dto.senha.length < 8) throw new ConflictException('A senha deve ter pelo menos 8 caracteres.');
    const email = dto.email.trim().toLowerCase();
    if (await this.prisma.usuario.findUnique({ where: { email } })) throw new ConflictException('Email já cadastrado.');
    const senha = await bcrypt.hash(dto.senha, 12);
    const usuario = await this.prisma.usuario.create({
      data: { email, senha, tipo: dto.tipo,
        ...(dto.tipo === 'AGENTE'
          ? { agente: { create: { nome: dto.nome.trim(), especialidade: dto.especialidade?.trim() ?? '', bio: dto.descricao?.trim(), cidade: dto.cidade?.trim() ?? '', endereco: dto.endereco?.trim() ?? '' } } }
          : { contratante: { create: { nome: dto.nome.trim(), empresa: dto.empresa?.trim(), telefone: dto.telefone?.trim(), descricao: dto.descricao?.trim(), site: dto.site?.trim(), cidade: dto.cidade?.trim(), endereco: dto.endereco?.trim(), categoria: dto.categoria?.trim() } } })
      },
      include: { agente: true, contratante: true },
    });
    return this.token(usuario);
  }
  async login(dto: LoginDto) {
    const usuario = await this.prisma.usuario.findUnique({ where: { email: dto.email.trim().toLowerCase() }, include: { agente: true, contratante: true } });
    if (!usuario || !(await bcrypt.compare(dto.senha, usuario.senha))) throw new UnauthorizedException('Email ou senha inválidos.');
    return this.token(usuario);
  }
  private token(usuario: any) { return { access_token: this.jwt.sign({ sub: usuario.id, email: usuario.email, tipo: usuario.tipo }), usuario: { id: usuario.id, email: usuario.email, tipo: usuario.tipo, perfil: usuario.agente ?? usuario.contratante } }; }
}