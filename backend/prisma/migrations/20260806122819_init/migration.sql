-- CreateTable
CREATE TABLE `usuario` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `senha` VARCHAR(191) NOT NULL,
    `tipo` ENUM('AGENTE', 'CONTRATANTE', 'ADMIN') NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `usuario_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agente_criativo` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `especialidade` VARCHAR(191) NOT NULL,
    `bio` TEXT NULL,
    `cidade` VARCHAR(191) NOT NULL DEFAULT '',
    `endereco` VARCHAR(191) NOT NULL DEFAULT '',
    `latitude` DOUBLE NULL,
    `longitude` DOUBLE NULL,
    `visivelMapa` BOOLEAN NOT NULL DEFAULT false,
    `avatarUrl` VARCHAR(191) NULL,
    `notaMedia` DOUBLE NOT NULL DEFAULT 0,
    `totalAvaliacoes` INTEGER NOT NULL DEFAULT 0,
    `totalProjetos` INTEGER NOT NULL DEFAULT 0,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `agente_criativo_usuarioId_key`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `contratante` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioId` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `empresa` VARCHAR(191) NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `contratante_usuarioId_key`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projeto` (
    `id` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NOT NULL,
    `descricao` TEXT NOT NULL,
    `categoria` VARCHAR(191) NOT NULL,
    `status` ENUM('ABERTO', 'EM_ANDAMENTO', 'CONCLUIDO', 'CANCELADO') NOT NULL DEFAULT 'ABERTO',
    `orcamento` DOUBLE NULL,
    `dataEvento` DATETIME(3) NULL,
    `contratanteId` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `candidatura` (
    `id` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDENTE', 'ACEITA', 'RECUSADA') NOT NULL DEFAULT 'PENDENTE',
    `mensagem` TEXT NULL,
    `agenteId` VARCHAR(191) NOT NULL,
    `projetoId` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `candidatura_agenteId_projetoId_key`(`agenteId`, `projetoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `portfolio` (
    `id` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `titulo` VARCHAR(191) NULL,
    `descricao` VARCHAR(191) NULL,
    `agenteId` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `avaliacao` (
    `id` VARCHAR(191) NOT NULL,
    `nota` INTEGER NOT NULL,
    `comentario` TEXT NULL,
    `agenteId` VARCHAR(191) NOT NULL,
    `contratanteId` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `agente_criativo` ADD CONSTRAINT `agente_criativo_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `contratante` ADD CONSTRAINT `contratante_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projeto` ADD CONSTRAINT `projeto_contratanteId_fkey` FOREIGN KEY (`contratanteId`) REFERENCES `contratante`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `candidatura` ADD CONSTRAINT `candidatura_agenteId_fkey` FOREIGN KEY (`agenteId`) REFERENCES `agente_criativo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `candidatura` ADD CONSTRAINT `candidatura_projetoId_fkey` FOREIGN KEY (`projetoId`) REFERENCES `projeto`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `portfolio` ADD CONSTRAINT `portfolio_agenteId_fkey` FOREIGN KEY (`agenteId`) REFERENCES `agente_criativo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacao` ADD CONSTRAINT `avaliacao_agenteId_fkey` FOREIGN KEY (`agenteId`) REFERENCES `agente_criativo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `avaliacao` ADD CONSTRAINT `avaliacao_contratanteId_fkey` FOREIGN KEY (`contratanteId`) REFERENCES `contratante`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
