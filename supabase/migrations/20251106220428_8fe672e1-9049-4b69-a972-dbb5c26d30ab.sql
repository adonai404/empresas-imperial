-- Fix responsaveis table column name from 'name' to 'nome'
ALTER TABLE public.responsaveis
  RENAME COLUMN name TO nome;