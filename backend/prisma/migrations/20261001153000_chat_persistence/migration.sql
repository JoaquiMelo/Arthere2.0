-- CreateTable
CREATE TABLE `conversa` (
    `id` VARCHAR(191) NOT NULL,
    `usuarioAId` VARCHAR(191) NOT NULL,
    `usuarioBId` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `atualizadoEm` DATETIME(3) NOT NULL,

    UNIQUE INDEX `conversa_usuarioAId_usuarioBId_key`(`usuarioAId`, `usuarioBId`),
    INDEX `conversa_usuarioBId_idx`(`usuarioBId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mensagem` (
    `id` VARCHAR(191) NOT NULL,
    `texto` TEXT NOT NULL,
    `conversaId` VARCHAR(191) NOT NULL,
    `remetenteId` VARCHAR(191) NOT NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `mensagem_conversaId_criadoEm_idx`(`conversaId`, `criadoEm`),
    INDEX `mensagem_remetenteId_idx`(`remetenteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `conversa` ADD CONSTRAINT `conversa_usuarioAId_fkey` FOREIGN KEY (`usuarioAId`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `conversa` ADD CONSTRAINT `conversa_usuarioBId_fkey` FOREIGN KEY (`usuarioBId`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mensagem` ADD CONSTRAINT `mensagem_conversaId_fkey` FOREIGN KEY (`conversaId`) REFERENCES `conversa`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mensagem` ADD CONSTRAINT `mensagem_remetenteId_fkey` FOREIGN KEY (`remetenteId`) REFERENCES `usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
