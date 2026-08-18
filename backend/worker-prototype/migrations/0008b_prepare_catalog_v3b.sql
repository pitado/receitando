-- Prepara IDs novos usados pela expansão v3b quando o slug já existe no catálogo antigo.
-- Mantemos as receitas antigas intactas para preservar favoritos, comentários e URLs existentes.
PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO recipes (
  id, title, slug, description, instructions, prep_minutes, servings,
  meal_type, difficulty, source_type, source_name
) VALUES (
  'rec-v3b-abobrinha-refogada',
  'Abobrinha refogada com cebola',
  'abobrinha-refogada-com-cebola',
  'Abobrinha macia com alho e cebola, feita rapidamente na frigideira.',
  '1. Corte a abobrinha em pedaços.\n2. Refogue alho e cebola no azeite.\n3. Junte a abobrinha e cozinhe até ficar macia, mas ainda firme.',
  15,
  3,
  'acompanhamento',
  'FACIL',
  'OWN',
  'Receitando'
);

INSERT OR IGNORE INTO recipes (
  id, title, slug, description, instructions, prep_minutes, servings,
  meal_type, difficulty, source_type, source_name
) VALUES (
  'rec-v3b-brocolis-alho',
  'Brócolis salteado no alho',
  'brocolis-salteado-alho',
  'Brócolis salteado rapidamente com alho e azeite.',
  '1. Separe o brócolis em floretes e cozinhe até ficar al dente.\n2. Doure o alho no azeite.\n3. Junte o brócolis e salteie por alguns minutos.',
  15,
  3,
  'acompanhamento',
  'FACIL',
  'OWN',
  'Receitando'
);
