ALTER TABLE `contratante`
  ADD COLUMN `nomeSocial` VARCHAR(191) NULL,
  ADD COLUMN `pronomes` VARCHAR(191) NULL,
  ADD COLUMN `cpfCnpj` VARCHAR(191) NULL,
  ADD COLUMN `telefone` VARCHAR(191) NULL,
  ADD COLUMN `descricao` TEXT NULL,
  ADD COLUMN `site` VARCHAR(191) NULL,
  ADD COLUMN `cidade` VARCHAR(191) NULL,
  ADD COLUMN `endereco` VARCHAR(191) NULL,
  ADD COLUMN `categoria` VARCHAR(191) NULL;

CREATE UNIQUE INDEX `contratante_cpfCnpj_key` ON `contratante`(`cpfCnpj`);
CREATE INDEX `contratante_cidade_idx` ON `contratante`(`cidade`);
CREATE INDEX `contratante_categoria_idx` ON `contratante`(`categoria`);

CREATE INDEX `agente_criativo_cidade_idx` ON `agente_criativo`(`cidade`);
CREATE INDEX `agente_criativo_especialidade_idx` ON `agente_criativo`(`especialidade`);
CREATE INDEX `projeto_categoria_idx` ON `projeto`(`categoria`);
CREATE INDEX `projeto_status_idx` ON `projeto`(`status`);
CREATE INDEX `candidatura_status_idx` ON `candidatura`(`status`);
CREATE UNIQUE INDEX `avaliacao_agenteId_contratanteId_key` ON `avaliacao`(`agenteId`,`contratanteId`);

CREATE TABLE `evento` (
  `id` VARCHAR(191) NOT NULL,
  `titulo` VARCHAR(191) NOT NULL,
  `descricao` TEXT NOT NULL,
  `categoria` VARCHAR(191) NOT NULL,
  `local` VARCHAR(191) NOT NULL,
  `cidade` VARCHAR(191) NOT NULL,
  `dataEvento` DATETIME(3) NOT NULL,
  `horario` VARCHAR(191) NULL,
  `organizador` VARCHAR(191) NULL,
  `premium` BOOLEAN NOT NULL DEFAULT false,
  `fixado` BOOLEAN NOT NULL DEFAULT false,
  `contratanteId` VARCHAR(191) NULL,
  `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `atualizadoEm` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `evento_cidade_idx`(`cidade`),
  INDEX `evento_categoria_idx`(`categoria`),
  INDEX `evento_dataEvento_idx`(`dataEvento`),
  INDEX `evento_fixado_premium_idx`(`fixado`, `premium`),
  CONSTRAINT `evento_contratanteId_fkey`
    FOREIGN KEY (`contratanteId`) REFERENCES `contratante`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;