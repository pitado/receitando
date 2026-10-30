// The initial Receitando PostgreSQL cutover deliberately starts with new user
// registrations and new recipes. No legacy D1 records should be imported.
// Keep this command explicitly disabled to prevent accidental migration.
throw new Error(
  "Migração de dados D1 desativada: o início no Neon foi autorizado sem contas, receitas ou ingredientes antigos. " +
  "O D1 original permanece disponível para recuperação se necessário."
);
