-- Keep the physical MySQL column aligned with schema.prisma (@db.Text).
ALTER TABLE `portfolio`
  MODIFY COLUMN `descricao` TEXT NULL;
