import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
@Injectable()
export class AvaliacoesService {
 constructor(private readonly prisma:PrismaService){}
 listar(agenteId:string){return this.prisma.avaliacao.findMany({where:{agenteId},include:{contratante:{select:{id:true,nome:true,nomeSocial:true,avatarUrl:true}}},orderBy:{criadoEm:'desc'}});}
 async avaliar(uid:string,agenteId:string,d:any){
  const contratante=await this.prisma.contratante.findUnique({where:{usuarioId:uid}});
  if(!contratante)throw new ForbiddenException('Somente contratantes podem avaliar agentes.');
  const agente=await this.prisma.agenteCriativo.findUnique({where:{id:agenteId}});
  if(!agente)throw new NotFoundException('Agente não encontrado.');
  const nota=Number(d.nota);
  if(!Number.isInteger(nota)||nota<1||nota>5)throw new ConflictException('A nota deve ser um número inteiro de 1 a 5.');
  const existente=await this.prisma.avaliacao.findFirst({where:{agenteId,contratanteId:contratante.id}});
  if(existente)throw new ConflictException('Você já avaliou este agente.');
  return this.prisma.$transaction(async tx=>{
   const avaliacao=await tx.avaliacao.create({data:{agenteId,contratanteId:contratante.id,nota,comentario:d.comentario?.trim()||undefined}});
   const agregada=await tx.avaliacao.aggregate({where:{agenteId},_avg:{nota:true},_count:{nota:true}});
   await tx.agenteCriativo.update({where:{id:agenteId},data:{notaMedia:agregada._avg.nota??0,totalAvaliacoes:agregada._count.nota}});
   return avaliacao;
  });
 }
}