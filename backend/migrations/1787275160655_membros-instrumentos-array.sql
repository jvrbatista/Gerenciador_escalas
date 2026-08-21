-- Múltiplos instrumentos por membro. Antes era `instrumento TEXT` (valor único,
-- texto livre); vira `instrumentos TEXT[]` pra permitir mais de uma função (ex.:
-- Vocal + Teclado). A UI agora escolhe de uma lista fixa em vez de digitar.

-- Up Migration

ALTER TABLE membros ADD COLUMN instrumentos TEXT[] NOT NULL DEFAULT '{}';

UPDATE membros
SET instrumentos = ARRAY[instrumento]
WHERE instrumento IS NOT NULL AND instrumento <> '';

ALTER TABLE membros DROP COLUMN instrumento;

-- Down Migration

ALTER TABLE membros ADD COLUMN instrumento TEXT;

UPDATE membros
SET instrumento = instrumentos[1]
WHERE array_length(instrumentos, 1) > 0;

ALTER TABLE membros DROP COLUMN instrumentos;
