export type TipoPublico = 'AGENTE' | 'CONTRATANTE_EVENTOS' | 'CONTRATANTE_OPORTUNIDADES';

export class RegisterDto {
  email!: string; senha!: string; tipo!: TipoPublico; nome!: string;
  nomeSocial?: string; pronomes?: string; cpfCnpj?: string;
  especialidade?: string; empresa?: string; telefone?: string;
  descricao?: string; site?: string; estado?: string; cidade?: string; endereco?: string; categoria?: string;
}
export class LoginDto { email!: string; senha!: string; }