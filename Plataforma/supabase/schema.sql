-- ============================================================
--  Plataforma generadora de landing pages · esquema completo
--
--  Cómo correrlo:
--    Supabase → proyecto bcgboknagavmluglllun → SQL Editor → New query
--    → pega TODO esto → Run.
--
--  Se puede volver a correr sin miedo: no borra ni pisa nada que ya exista.
-- ============================================================

-- ---------- estados de una generación ----------
do $$
begin
  create type public.estado_generacion as enum (
    'encolado',    -- la plataforma ya avisó a n8n, n8n todavía no arranca
    'generando',   -- n8n está trabajando
    'desplegado',  -- hay URL viva
    'error'
  );
exception
  when duplicate_object then null;
end
$$;

-- ---------- el negocio, tal como se captura en el formulario ----------
create table if not exists public.negocios (
  id                    uuid primary key default gen_random_uuid(),

  -- identidad
  nombre_negocio        text not null,
  descripcion           text not null,
  servicios             text[] not null default '{}',
  giro                  text,

  -- contacto. El teléfono de WhatsApp es la llave del negocio del lado de
  -- n8n, y de él salen todos los botones de contacto de la página.
  telefono_whatsapp     text not null,
  telefonos_adicionales text[] not null default '{}',
  horarios              text,
  ubicaciones           text[] not null default '{}',
  instagram_url         text,
  facebook_url          text,

  -- marca. color_marca es opcional: si viene, manda sobre el análisis de
  -- visión del logo que hace el workflow; si no, el workflow lo deduce.
  color_marca           text check (color_marca is null or color_marca ~ '^#[0-9a-fA-F]{6}$'),
  logo_url              text,
  logo_path             text,

  -- [{ "url": "...", "path": "...", "nombre": "..." }]
  imagenes              jsonb not null default '[]'::jsonb,

  plantilla_slug        text not null default '2-extra',

  creado_en             timestamptz not null default now(),
  actualizado_en        timestamptz not null default now()
);

-- ---------- un renglón por intento de generación ----------
create table if not exists public.sitio_generaciones (
  id                uuid primary key default gen_random_uuid(),
  negocio_id        uuid not null references public.negocios (id) on delete cascade,

  estado            public.estado_generacion not null default 'encolado',
  -- texto corto para la barra de progreso del dashboard
  paso              text,

  deployment_url    text,
  repo_url          text,

  -- ids del lado de n8n, para poder rastrear un problema hasta su origen
  proyecto_id       bigint,
  sitio_id          bigint,
  n8n_execution_id  text,

  error             text,

  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now(),
  terminado_en      timestamptz
);

create index if not exists idx_negocios_creado      on public.negocios (creado_en desc);
create index if not exists idx_negocios_telefono    on public.negocios (telefono_whatsapp);
create index if not exists idx_generaciones_negocio on public.sitio_generaciones (negocio_id, creado_en desc);
create index if not exists idx_generaciones_estado  on public.sitio_generaciones (estado);

-- ---------- actualizado_en automático ----------
create or replace function public.tocar_actualizado_en()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

drop trigger if exists trg_negocios_actualizado on public.negocios;
create trigger trg_negocios_actualizado
  before update on public.negocios
  for each row execute function public.tocar_actualizado_en();

drop trigger if exists trg_generaciones_actualizado on public.sitio_generaciones;
create trigger trg_generaciones_actualizado
  before update on public.sitio_generaciones
  for each row execute function public.tocar_actualizado_en();

-- ---------- RLS ----------
-- Se habilita sin políticas permisivas A PROPÓSITO: la plataforma entra
-- siempre por el servidor (Next.js) con la service role key, que ignora RLS.
-- Así el navegador no puede leer ni escribir estas tablas ni con la anon key.
alter table public.negocios           enable row level security;
alter table public.sitio_generaciones enable row level security;

-- ---------- Storage ----------
-- Bucket público: n8n baja el logo y las imágenes por URL desde otro
-- servidor, sin credenciales de Supabase. Los archivos solo entran por el
-- servidor de la plataforma.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'negocios', 'negocios', true, 10485760,
  array['image/png','image/jpeg','image/jpg','image/webp','image/gif','image/svg+xml']
)
on conflict (id) do update
  set public             = excluded.public,
      file_size_limit    = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------- comprobación ----------
select
  (select count(*) from information_schema.tables
    where table_schema = 'public' and table_name in ('negocios','sitio_generaciones')) as tablas_creadas,
  (select count(*) from storage.buckets where id = 'negocios') as bucket_creado;
