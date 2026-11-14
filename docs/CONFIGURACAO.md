# Configuração externa necessária

1. Criar um projeto gratuito em Supabase.
2. Executar a migração em `supabase/migrations` no SQL Editor ou através da CLI.
3. Copiar `.env.example` para `.env` e preencher apenas a URL e a chave pública `anon`.
4. Em Auth, desativar inscrições públicas depois de criar os dois utilizadores autorizados.

Nunca colocar a chave `service_role` numa variável `VITE_*`.

A sincronização Garmin direta depende de aprovação oficial Garmin Health API. Até essa aprovação, deve ser usada importação manual; a aplicação nunca solicitará a palavra-passe Garmin.
