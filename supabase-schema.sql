-- Script SQL para criar as tabelas do SisMobi no Supabase
-- Execute este script no Editor SQL do Supabase

-- 1. Tabela de Propriedades
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR NOT NULL,
    address TEXT NOT NULL,
    energy_unit_name VARCHAR,
    type VARCHAR NOT NULL CHECK (type IN ('apartment', 'house', 'commercial')),
    purchase_price DECIMAL(12,2) NOT NULL DEFAULT 0,
    rent_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    status VARCHAR NOT NULL DEFAULT 'vacant' CHECK (status IN ('rented', 'vacant', 'maintenance')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Inquilinos
CREATE TABLE IF NOT EXISTS public.tenants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    cpf VARCHAR,
    phone VARCHAR NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    agreed_payment_date TIMESTAMP WITH TIME ZONE,
    monthly_rent DECIMAL(10,2) NOT NULL DEFAULT 0,
    deposit DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_method VARCHAR CHECK (payment_method IN ('À vista', 'A prazo')),
    installments VARCHAR CHECK (installments IN ('2x', '3x')),
    deposit_paid_installments BOOLEAN[],
    formalized_contract BOOLEAN DEFAULT false,
    status VARCHAR NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Transações
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    type VARCHAR NOT NULL CHECK (type IN ('income', 'expense')),
    category VARCHAR NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    recurring JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Tabela de Documentos
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR NOT NULL CHECK (type IN ('Contrato de locação', 'Comprovante de pagamento', 'RG', 'CPF', 'Laudo técnico', 'Outros')),
    issue_date TIMESTAMP WITH TIME ZONE NOT NULL,
    has_validity BOOLEAN NOT NULL DEFAULT false,
    validity_date TIMESTAMP WITH TIME ZONE,
    file_name VARCHAR,
    file_url TEXT,
    observations TEXT,
    property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
    tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
    status VARCHAR NOT NULL DEFAULT 'Pendente' CHECK (status IN ('Válido', 'Expirado', 'Pendente', 'Revisão')),
    contract_signed BOOLEAN NOT NULL DEFAULT false,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Tabela de Contas de Energia
CREATE TABLE IF NOT EXISTS public.energy_bills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    observations TEXT,
    is_paid BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    group_id VARCHAR NOT NULL,
    group_name VARCHAR NOT NULL,
    total_group_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_group_consumption DECIMAL(10,2) NOT NULL DEFAULT 0,
    properties_in_group JSONB NOT NULL DEFAULT '[]'
);

-- 6. Tabela de Contas de Água
CREATE TABLE IF NOT EXISTS public.water_bills (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date TIMESTAMP WITH TIME ZONE NOT NULL,
    observations TEXT,
    is_paid BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    group_id VARCHAR NOT NULL,
    group_name VARCHAR NOT NULL,
    total_group_value DECIMAL(10,2) NOT NULL DEFAULT 0,
    properties_in_group JSONB NOT NULL DEFAULT '[]'
);

-- 7. Tabela de Informors
CREATE TABLE IF NOT EXISTS public.informors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nome VARCHAR NOT NULL,
    valor DECIMAL(10,2) NOT NULL DEFAULT 0,
    vencimento VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_tenants_property_id ON public.tenants(property_id);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);
CREATE INDEX IF NOT EXISTS idx_transactions_property_id ON public.transactions(property_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_documents_property_id ON public.documents(property_id);
CREATE INDEX IF NOT EXISTS idx_documents_tenant_id ON public.documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);

-- Habilitar RLS (Row Level Security) - Opcional, para aplicações multiusuário
-- ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.energy_bills ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.water_bills ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.informors ENABLE ROW LEVEL SECURITY;

-- Comentários das tabelas
COMMENT ON TABLE public.properties IS 'Tabela de propriedades do sistema imobiliário';
COMMENT ON TABLE public.tenants IS 'Tabela de inquilinos vinculados às propriedades';
COMMENT ON TABLE public.transactions IS 'Tabela de transações financeiras (receitas e despesas)';
COMMENT ON TABLE public.documents IS 'Tabela de documentos vinculados às propriedades e inquilinos';
COMMENT ON TABLE public.energy_bills IS 'Tabela de contas de energia com rateio';
COMMENT ON TABLE public.water_bills IS 'Tabela de contas de água com rateio';
COMMENT ON TABLE public.informors IS 'Tabela de informors (ITR, IPTU, etc.)';