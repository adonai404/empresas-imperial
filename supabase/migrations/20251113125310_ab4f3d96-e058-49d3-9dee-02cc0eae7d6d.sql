-- Adicionar campos de credenciais à tabela system_links
ALTER TABLE public.system_links 
ADD COLUMN username TEXT,
ADD COLUMN password TEXT;

COMMENT ON COLUMN public.system_links.username IS 'Nome de usuário/login para acesso ao sistema';
COMMENT ON COLUMN public.system_links.password IS 'Senha para acesso ao sistema (armazenada de forma mascarada no frontend)';