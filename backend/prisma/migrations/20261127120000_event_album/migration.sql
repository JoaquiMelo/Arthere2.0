CREATE TABLE `evento_album` (
  `eventoId` VARCHAR(191) NOT NULL,
  `fotos` JSON NOT NULL,
  PRIMARY KEY (`eventoId`),
  CONSTRAINT `evento_album_eventoId_fkey` FOREIGN KEY (`eventoId`) REFERENCES `evento`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
