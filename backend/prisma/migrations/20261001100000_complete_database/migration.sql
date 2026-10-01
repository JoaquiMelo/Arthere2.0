-- Arthere 2.0 - database completion
-- Adds missing Evento table and contractor profile fields.
ALTER TABLE `contratante`
  ADD COLUMN `nomeSocial` VARCHAR(191) NULL,
  ADD COLUMN `pronomes` VARCHAR(191) NULL,
  ADD COLUMN `cpfCnpj` VARCHAR(191) NULL,
  ADD UNIQUE INDEX `contratante_cpfCnpj_key`(`cpfCnpj`);

CREATE TABLE `evento` (
  `id` VARCHAR(191) NOT NULL,
  `titulo` VARCHAR(191) NOT NULL,
  `descricao` TEXT NOT NULL,
  `categoria` VARCHAR(191) NOT NULL,
  `local` VARCHAR(191) NOT NULL,
  `cidade` VARCHAR(191) NOT NULL,
  `dataEvento` DATETIME(3) NOT NULL,
  `horario` VARCHAR(191) NOT NULL,
  `organizador` VARCHAR(191) NOT NULL,
  `premium` BOOLEAN NOT NULL DEFAULT false,
  `fixado` BOOLEAN NOT NULL DEFAULT false,
  `contratanteId` VARCHAR(191) NULL,
  `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `evento_cidade_idx`(`cidade`),
  INDEX `evento_categoria_idx`(`categoria`),
  INDEX `evento_dataEvento_idx`(`dataEvento`),
  INDEX `evento_premium_fixado_idx`(`premium`, `fixado`),
  CONSTRAINT `evento_contratanteId_fkey`
    FOREIGN KEY (`contratanteId`) REFERENCES `contratante`(`id`)
    ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;