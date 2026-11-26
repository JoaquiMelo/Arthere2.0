CREATE TABLE `upload_imagem` (
  `filename` VARCHAR(191) NOT NULL,
  `mime` VARCHAR(191) NOT NULL,
  `conteudo` LONGBLOB NOT NULL,
  `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`filename`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
