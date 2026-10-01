export type TipoPublico = 'AGENTE' | 'CONTRATANTE';

export class RegisterDto {
  email!: string; senha!: string; tipo!: TipoPublico; nome!: string;
  nomeSocial?: string; pronomes?: string; cpfCnpj?: string;
  especialidade?: string; empresa?: string; telefone?: string;
  descricao?: string; site?: string; cidade?: string; endereco?: string; categoria?: string;
}
export class LoginDto { email!: string; senha!: string; }