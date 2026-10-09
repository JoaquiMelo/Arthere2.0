-- Separate event organizers from opportunity publishers.
-- Existing accounts/data are intentionally disposable for the planned database reset.
ALTER TABLE `usuario`
  MODIFY COLUMN `tipo` ENUM(
    'AGENTE',
    'CONTRATANTE_EVENTOS',
    'CONTRATANTE_OPORTUNIDADES',
    'ADMIN'
  ) NOT NULL;
