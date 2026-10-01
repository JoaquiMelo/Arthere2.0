-- CreateTable
CREATE TABLE `solicitacao_evento` (
    `id` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDENTE', 'ACEITA', 'RECUSADA') NOT NULL DEFAULT 'PENDENTE',
    `mensagem` TEXT NULL,
    `agenteId` VARCHAR(191) NOT NULL,
    `eventoId` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `solicitacao_evento_agenteId_eventoId_key`(`agenteId`, `eventoId`),
    INDEX `solicitacao_evento_eventoId_idx`(`eventoId`),
    INDEX `solicitacao_evento_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `solicitacao_evento` ADD CONSTRAINT `solicitacao_evento_agenteId_fkey` FOREIGN KEY (`agenteId`) REFERENCES `agente_criativo`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `solicitacao_evento` ADD CONSTRAINT `solicitacao_evento_eventoId_fkey` FOREIGN KEY (`eventoId`) REFERENCES `evento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
