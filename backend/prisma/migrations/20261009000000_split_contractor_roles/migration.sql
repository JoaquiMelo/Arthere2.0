-- Split the legacy contractor role into event and opportunity contractors.
-- Keep existing accounts valid by assigning legacy contractors to event contractors.
-- This migration also runs against a freshly created database after the init migration.
ALTER TABLE `usuario`
  MODIFY COLUMN `tipo` ENUM(
    'AGENTE',
    'CONTRATANTE',
    'CONTRATANTE_EVENTOS',
    'CONTRATANTE_OPORTUNIDADES',
    'ADMIN'
  ) NOT NULL;

UPDATE `usuario`
SET `tipo` = 'CONTRATANTE_EVENTOS'
WHERE `tipo` = 'CONTRATANTE';

ALTER TABLE `usuario`
  MODIFY COLUMN `tipo` ENUM(
    'AGENTE',
    'CONTRATANTE_EVENTOS',
    'CONTRATANTE_OPORTUNIDADES',
    'ADMIN'
  ) NOT NULL;
