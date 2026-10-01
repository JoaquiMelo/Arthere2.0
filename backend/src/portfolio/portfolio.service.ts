import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class PortfolioService {
 constructor(private readonly prisma:PrismaService){}
 listar(agenteId:string){return this.prisma.portfolio.findMany({where:{agenteId},orderBy:{criadoEm:'desc'}});}
 private async dono(uid:string,id:string){const agente=await this.prisma.agenteCriativo.findUnique({where:{usuarioId:uid}});if(!agente)throw new ForbiddenException('Somente agentes criativos possuem portfólio.');const item=await this.prisma.portfolio.findUnique({where:{id}});if(!item)throw new NotFoundException('Item do portfólio não encontrado.');if(item.agenteId!==agente.id)throw new ForbiddenException('Acesso negado.');return item;}
 async criar(uid:string,d:any){const agente=await this.prisma.agenteCriativo.findUnique({where:{usuarioId:uid}});if(!agente)throw new ForbiddenException('Somente agentes criativos possuem portfólio.');if(!d.imageUrl)throw new NotFoundException('imageUrl é obrigatório.');return this.prisma.portfolio.create({data:{imageUrl:String(d.imageUrl).trim(),titulo:d.titulo?.trim()||undefined,descricao:d.descricao?.trim()||undefined,agenteId:agente.id}});}
 async atualizar(uid:string,id:string,d:any){await this.dono(uid,id);return this.prisma.portfolio.update({where:{id},data:{...(d.imageUrl!==undefined?{imageUrl:String(d.imageUrl).trim()}:{}),...(d.titulo!==undefined?{titulo:d.titulo?.trim()||null}:{}),...(d.descricao!==undefined?{descricao:d.descricao?.trim()||null}:{})}});}
 async remover(uid:string,id:string){await this.dono(uid,id);return this.prisma.portfolio.delete({where:{id}});}
}