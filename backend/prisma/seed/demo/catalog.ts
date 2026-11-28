// Pontos aproximados em áreas públicas urbanas. Nenhuma localização residencial é usada.
export const cities = [
  { name: 'Mongaguá', counts: [10, 2, 3], points: [[-24.0900, -46.6230], [-24.1038, -46.6424], [-24.1134, -46.6602]] },
  { name: 'Santos', counts: [9, 2, 3], points: [[-23.9322, -46.3297], [-23.9652, -46.3237], [-23.9509, -46.3282]] },
  { name: 'Praia Grande', counts: [8, 2, 2], points: [[-24.0110, -46.4146], [-24.0260, -46.4695], [-24.0351, -46.4934]] },
  { name: 'São Vicente', counts: [6, 1, 2], points: [[-23.9621, -46.3883], [-23.9632, -46.3766], [-23.9470, -46.4099]] },
  { name: 'Itanhaém', counts: [5, 1, 1], points: [[-24.1818, -46.7886], [-24.1904, -46.7984], [-24.2020, -46.8211]] },
  { name: 'Guarujá', counts: [4, 1, 1], points: [[-23.9930, -46.2550], [-23.9815, -46.2481], [-23.9650, -46.2934]] },
  { name: 'Peruíbe', counts: [3, 1, 1], points: [[-24.3206, -47.0002], [-24.3102, -46.9890], [-24.3027, -46.9817]] },
  { name: 'Cubatão', counts: [3, 0, 1], points: [[-23.8882, -46.4254], [-23.8892, -46.4175], [-23.8788, -46.4252]] },
  { name: 'Bertioga', counts: [2, 0, 1], points: [[-23.8511, -46.1392], [-23.8356, -46.1304], [-23.8215, -46.1094]] },
] as const;

export const specialties = [
  { name: 'Fotografia', quota: 7, field: 'imagem', practice: 'fotografia documental e retrato ambiental', techniques: 'luz natural, edição de cor e sequência narrativa', works: ['Ensaio documental', 'Retratos em série', 'Reportagem visual'] },
  { name: 'Design gráfico', quota: 7, field: 'gráfico', practice: 'identidade visual e direção de arte', techniques: 'tipografia, grid editorial e impressão em duas cores', works: ['Sistema de identidade', 'Publicação editorial', 'Cartazes para a rua'] },
  { name: 'Audiovisual', quota: 6, field: 'imagem', practice: 'documentários curtos e vídeos de música', techniques: 'roteiro de campo, som direto e montagem', works: ['Curta documental', 'Clipe independente', 'Diário em vídeo'] },
  { name: 'Música', quota: 6, field: 'cena', practice: 'arranjos e produção de shows independentes', techniques: 'arranjo autoral, captação ao vivo e edição de áudio', works: ['Sessão acústica', 'Repertório autoral', 'Ensaio aberto'] },
  { name: 'Artes visuais', quota: 4, field: 'gráfico', practice: 'exposição e intervenção no espaço público', techniques: 'pigmento, montagem modular e composição espacial', works: ['Instalação modular', 'Série de pinturas', 'Intervenção urbana'] },
  { name: 'Ilustração', quota: 4, field: 'gráfico', practice: 'ilustração editorial e narrativas desenhadas', techniques: 'nanquim, colagem e desenho digital', works: ['Caderno ilustrado', 'Narrativa em quadrinhos', 'Ilustrando a cidade'] },
  { name: 'Produção cultural', quota: 4, field: 'cena', practice: 'curadoria comunitária e produção de atividades públicas', techniques: 'escuta de público, planejamento e mediação cultural', works: ['Circuito de bairros', 'Mostra itinerante', 'Programa educativo'] },
  { name: 'Artesanato', quota: 3, field: 'oficina', practice: 'peças manuais em fibras e cerâmica', techniques: 'modelagem, trançado e acabamento manual', works: ['Coleção em argila', 'Tecidos e fibras', 'Objetos de pequeno formato'] },
  { name: 'Moda', quota: 3, field: 'oficina', practice: 'modelagem autoral e reaproveitamento têxtil', techniques: 'moulage, tingimento e costura', works: ['Coleção cápsula', 'Estudo têxtil', 'Editorial de figurino'] },
  { name: 'Dança', quota: 2, field: 'cena', practice: 'dança contemporânea e criação coletiva', techniques: 'improvisação, partitura corporal e composição', works: ['Dança em percurso', 'Experimento coreográfico', 'Corpos em diálogo'] },
  { name: 'Teatro', quota: 2, field: 'cena', practice: 'dramaturgia e teatro de grupo', techniques: 'jogo cênico, direção de atores e cenografia', works: ['Leitura encenada', 'Peça de bolso', 'Cena em praça'] },
  { name: 'Literatura', quota: 2, field: 'oficina', practice: 'escrita de crônicas e mediação de leitura', techniques: 'entrevista, edição literária e leitura pública', works: ['Série de crônicas', 'Cartas de bairro', 'Edição de bolso'] },
] as const;

export type Specialty = (typeof specialties)[number];
export type City = (typeof cities)[number];
export const organizations = [
  'Maré de Dentro', 'Bússola de Barro', 'Margem Inventada', 'Verso de Sal', 'Arco de Restinga',
  'Farol de Papel', 'Varanda das Marés', 'Cais das Linhas', 'Foz em Cena', 'Entrequadras do Litoral',
];

export const subjects = [
  'os trajetos do trabalho no litoral', 'a memória dos mercados de bairro', 'os encontros de fim de tarde',
  'a paisagem entre a serra e a praia', 'as redes de colaboração das feiras', 'as tradições de grupos comunitários',
  'as mudanças de ritmo da cidade', 'a relação entre música e espaço público', 'a cultura das praças',
  'a circulação de zines e publicações', 'as formas e cores do comércio local', 'os saberes transmitidos entre gerações',
  'a experiência de quem cruza a região de ônibus', 'a transformação de materiais reaproveitados',
  'os modos de ocupar ruas e palcos', 'a convivência nos espaços de leitura',
];

export const eventFormats = [
  ['Cultura', 'Circuito de cultura', 'programação de coletivos e conversa com o público'],
  ['Artes Visuais', 'Mostra de artes visuais', 'obras em pequeno formato e mediação para visitantes'],
  ['Música', 'Sessões ao vivo', 'apresentações de artistas locais com repertório autoral'],
  ['Fotografia', 'Caminhada fotográfica', 'observação do território e edição coletiva das imagens'],
  ['Literatura', 'Encontro de escrita', 'leituras públicas e uma oficina de criação'],
  ['Moda', 'Laboratório de moda', 'exposição de figurinos, experimentos têxteis e reaproveitamento'],
  ['Design', 'Encontro de publicação', 'projetos editoriais independentes, cartazes e oficinas'],
  ['Dança', 'Mostra de dança', 'peças curtas e conversa sobre os processos coreográficos'],
  ['Teatro', 'Circuito de cenas', 'esquetes, exercícios de dramaturgia e debate'],
  ['Audiovisual', 'Mostra de curtas', 'projeções independentes e conversa com a equipe de produção'],
  ['Artesanato', 'Feira de feitos à mão', 'mesas de produtores, oficinas e demonstrações de técnicas'],
] as const;

export const opportunityBriefs = [
  ['Fotografia', 'Cobertura fotográfica de festival', 1450, 'Entregar 45 imagens tratadas e uma seleção rápida para divulgação.'],
  ['Design gráfico', 'Identidade visual de uma feira editorial', 2800, 'Apresentar sistema de marca, cartaz, duas peças digitais e arquivos finais.'],
  ['Audiovisual', 'Captação de documentário independente', 3400, 'Planejar duas diárias e entregar o material organizado com som direto.'],
  ['Música', 'Performance acústica em encontro cultural', 950, 'Preparar um repertório autoral de 35 minutos e participar da passagem de som.'],
  ['Ilustração', 'Ilustrações para caderno de crônicas', 2200, 'Criar seis ilustrações, com esboços aprovados antes da arte final.'],
  ['Produção cultural', 'Coordenação de feira criativa', 2600, 'Organizar escala, fornecedores, montagem e comunicação com expositores.'],
  ['Design gráfico', 'Peças de divulgação para coletivo de bairro', 1200, 'Desenvolver uma sequência de peças e entregar os arquivos editáveis.'],
  ['Dança', 'Condução de oficina de movimento', 780, 'Preparar duas aulas abertas com exercícios adaptáveis para iniciantes.'],
  ['Artes visuais', 'Pesquisa visual para intervenção urbana', 1950, 'Apresentar estudos de composição e propor materiais para montagem temporária.'],
  ['Artesanato', 'Peças autorais para uma exposição', 1650, 'Prototipar e produzir uma série de objetos em cerâmica e fibras.'],
] as const;
