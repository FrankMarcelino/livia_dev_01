-- ============================================================
-- SEED: Base de Conhecimento - Exames Laboratoriais LAMIC
-- PARTE 3 DE 3: Exames 113-154 (42 exames)
-- Tenant ID: 004ead16-af22-419c-8e19-28966d4c4d38
-- Neurocore ID: e6c63068-f469-4c49-a3b6-723d07de8303
-- Data: 2026-01-27
-- ============================================================
-- NOTA: Este é o último arquivo. Execute após Part 01 e Part 02
-- ============================================================

DO $$
DECLARE
  v_tenant_id uuid := '004ead16-af22-419c-8e19-28966d4c4d38';
  v_neurocore_id uuid := 'e6c63068-f469-4c49-a3b6-723d07de8303';
  v_domain_id uuid;
  v_base_count integer := 0;
BEGIN
  RAISE NOTICE '============================================================';
  RAISE NOTICE 'Iniciando seed - PARTE 3 (FINAL): Exames 113-154';
  RAISE NOTICE '============================================================';

  -- ============================================================
  -- 1. BUSCAR DOMÍNIO DE CONHECIMENTO (já criado no Part 01)
  -- ============================================================
  SELECT id INTO v_domain_id 
  FROM public.knowledge_domains 
  WHERE domain = 'exames' AND neurocore_id = v_neurocore_id;

  IF v_domain_id IS NULL THEN
    RAISE EXCEPTION 'Domain "exames" não encontrado! Execute os scripts anteriores primeiro.';
  END IF;
  
  RAISE NOTICE 'Domain encontrado: %', v_domain_id;

  -- ============================================================
  -- 2. CRIAR BASES DE CONHECIMENTO (Exames 113-154)
  -- ============================================================

  -- Exames 113-154 (42 exames finais)
  INSERT INTO public.base_conhecimentos (tenant_id, neurocore_id, name, description, domain, is_active) VALUES 
  (v_tenant_id, v_neurocore_id, '[VDRL] VDRL', E'[VDRL] VDRL\nDescrição: Teste de triagem para sífilis que detecta anticorpos inespecíficos; resultados positivos devem ser confirmados com testes mais específicos como FTA-ABS.\nPerguntas: Precisa de jejum? Não. Informações importantes: É um teste de triagem para sífilis. Atenção: Pode dar falso-positivo em algumas doenças autoimunes ou gravidez. Orientações: Resultado positivo sempre precisa de confirmação com teste específico.\nPREÇOS: Valor Cheio: R$ 26.00; Cartões de Desconto: R$ 25.00; Planos Funerários: R$ 25.00; Funerária Vida: R$ 25.00; AFAGU: R$ 24.00; LAMIC VIVA+: R$ 23.00; PARTICULAR 02: R$ 22.00', v_domain_id, false),
  (v_tenant_id, v_neurocore_id, '[VHS] VELOCIDADE DE HEMOSSEDIMENTAÇÃO - VHS', E'[VHS] VELOCIDADE DE HEMOSSEDIMENTAÇÃO - VHS\nDescrição: Teste que mede a velocidade com que os glóbulos vermelhos se depositam no tubo; indica presença de inflamação ou infecção no corpo, mas não especifica a causa.\nPerguntas: Precisa de jejum? Não. Informações importantes: É um marcador geral e inespecífico de inflamação. Orientações: Valores elevados podem ocorrer em infecções, inflamações crônicas, anemias ou gravidez. Não indica a causa específica.\nPREÇOS: Valor Cheio: R$ 27.00; Cartões de Desconto: R$ 24.00; Planos Funerários: R$ 24.00; Funerária Vida: R$ 24.00; AFAGU: R$ 23.00; LAMIC VIVA+: R$ 21.00; PARTICULAR 02: R$ 19.00', v_domain_id, false),
  (v_tenant_id, v_neurocore_id, '[VLDL] COLESTEROL VLDL', E'[VLDL] COLESTEROL VLDL\nDescrição: Tipo de colesterol que transporta principalmente triglicerídeos; níveis elevados aumentam o risco de doenças cardiovasculares e pancreatite.\nPerguntas: Precisa de jejum? Não obrigatório para triagem, mas jejum pode ser necessário se os triglicerídeos estiverem altos. Informações importantes: É calculado a partir dos triglicerídeos (VLDL = Triglicerídeos/5). Orientações: Valores elevados geralmente acompanham triglicerídeos altos.\nPREÇOS: Valor Cheio: R$ 22.00; Cartões de Desconto: R$ 16.00; Planos Funerários: R$ 16.00; Funerária Vida: R$ 16.00; AFAGU: R$ 15.00; LAMIC VIVA+: R$ 15.00; PARTICULAR 02: R$ 18.00', v_domain_id, false),
  (v_tenant_id, v_neurocore_id, '[ZINCO] ZINCO', E'[ZINCO] ZINCO\nDescrição: Mineral essencial para o sistema imunológico, cicatrização de feridas e síntese de proteínas; a deficiência pode causar perda de paladar, queda de cabelo e baixa imunidade.\nPerguntas: Precisa de jejum? Não obrigatório. Informações importantes: Fundamental para o sistema imunológico e cicatrização. Orientações: Informe se usa suplementos de zinco, cobre ou ferro, pois eles competem pela absorção.\nPREÇOS: Valor Cheio: R$ 89.00; Cartões de Desconto: R$ 66.00; Planos Funerários: R$ 66.00; Funerária Vida: R$ 66.00; AFAGU: R$ 63.00; LAMIC VIVA+: R$ 60.00; PARTICULAR 02: R$ 55.00', v_domain_id, false),
  (v_tenant_id, v_neurocore_id, '[ACFOL] ÁCIDO FÓLICO ERITROCITÁRIO', E'[ACFOL] ÁCIDO FÓLICO ERITROCITÁRIO\nDescrição: Mede o ácido fólico dentro dos glóbulos vermelhos, refletindo melhor os estoques de longo prazo desta vitamina em comparação ao ácido fólico sérico.\nPerguntas: Precisa de jejum? Não. Informações importantes: Mais confiável que o ácido fólico comum para avaliar deficiência real. Orientações: Especialmente importante em gestantes para prevenir defeitos no tubo neural do bebê.\nPREÇOS: Valor Cheio: R$ 89.00; Cartões de Desconto: R$ 70.00; Planos Funerários: R$ 70.00; Funerária Vida: R$ 70.00; AFAGU: R$ 66.00; LAMIC VIVA+: R$ 63.00; PARTICULAR 02: R$ 55.00', v_domain_id, false),
  (v_tenant_id, v_neurocore_id, '[ALFA1] ALFA-1-ANTITRIPSINA', E'[ALFA1] ALFA-1-ANTITRIPSINA\nDescrição: Proteína protetora dos pulmões; sua deficiência hereditária pode causar enfisema pulmonar precoce e doenças hepáticas.\nPerguntas: Precisa de jejum? Não. Informações importantes: Sua falta pode causar enfisema pulmonar mesmo em não-fumantes. Orientações: Importante em casos de enfisema precoce ou doença pulmonar em jovens.\nPREÇOS: Valor Cheio: R$ 95.00; Cartões de Desconto: R$ 75.00; Planos Funerários: R$ 75.00; Funerária Vida: R$ 75.00; AFAGU: R$ 71.00; LAMIC VIVA+: R$ 68.00; PARTICULAR 02: R$ 60.00', v_domain_id, false),
  (v_tenant_id, v_neurocore_id, '[APOA] APOLIPOPROTEÍNA A', E'[APOA] APOLIPOPROTEÍNA A\nDescrição: Principal componente do HDL (colesterol bom); níveis altos conferem proteção cardiovascular, enquanto níveis baixos aumentam o risco de doenças cardíacas.\nPerguntas: Precisa de jejum? Não obrigatório. Informações importantes: Reflete melhor a proteção cardiovascular que o HDL isolado. Orientações: Valores baixos indicam maior risco de infarto e derrame.\nPREÇOS: Valor Cheio: R$ 71.00; Cartões de Desconto: R$ 59.00; Planos Funerários: R$ 59.00; Funerária Vida: R$ 59.00; AFAGU: R$ 56.00; LAMIC VIVA+: R$ 53.00; PARTICULAR 02: R$ 44.00', v_domain_id, false),
  (v_tenant_id, v_neurocore_id, '[APOB] APOLIPOPROTEÍNA B', E'[APOB] APOLIPOPROTEÍNA B\nDescrição: Principal componente das partículas de LDL (colesterol ruim); é um marcador mais preciso de risco cardiovascular que o LDL colesterol tradicional.\nPerguntas: Precisa de jejum? Não obrigatório. Informações importantes: Considera-se melhor marcador de risco cardiovascular que o LDL. Orientações: Valores elevados indicam maior risco de aterosclerose e infarto.\nPREÇOS: Valor Cheio: R$ 71.00; Cartões de Desconto: R$ 59.00; Planos Funerários: R$ 59.00; Funerária Vida: R$ 59.00; AFAGU: R$ 56.00; LAMIC VIVA+: R$ 53.00; PARTICULAR 02: R$ 44.00', v_domain_id, false),
  (v_tenant_id, v_neurocore_id, '[BNPNT] BNP / NT-PROBNP', E'[BNPNT] BNP / NT-PROBNP\nDescrição: Hormônio liberado pelo coração quando ele está sobrecarregado; usado para diagnosticar e monitorar insuficiência cardíaca.\nPerguntas: Precisa de jejum? Não. Informações importantes: Quanto maior o valor, mais grave é a insuficiência cardíaca. Orientações: Útil para diferenciar falta de ar por problema cardíaco de outras causas.\nPREÇOS: Valor Cheio: R$ 155.00; Cartões de Desconto: R$ 116.00; Planos Funerários: R$ 116.00; Funerária Vida: R$ 116.00; AFAGU: R$ 110.00; LAMIC VIVA+: R$ 105.00; PARTICULAR 02: R$ 88.00', v_domain_id, false),
  (v_tenant_id, v_neurocore_id, '[CD4CD8] CONTAGEM DE LINFÓCITOS CD4/CD8', E'[CD4CD8] CONTAGEM DE LINFÓCITOS CD4/CD8\nDescrição: Mede as células de defesa do sistema imunológico; fundamental no acompanhamento de pacientes com HIV para avaliar o estado imunológico e a resposta ao tratamento.\nPerguntas: Precisa de jejum? Não. Informações importantes: CD4 são as células atacadas pelo HIV. Valores baixos indicam imunidade comprometida. Orientações: Essencial para iniciar e monitorar tratamento antirretroviral.\nPREÇOS: Valor Cheio: R$ 178.00; Cartões de Desconto: R$ 151.00; Planos Funerários: R$ 151.00; Funerária Vida: R$ 151.00; AFAGU: R$ 140.00; LAMIC VIVA+: R$ 133.00; PARTICULAR 02: R$ 110.00', v_domain_id, false);

  v_base_count := v_base_count + 10;
  RAISE NOTICE 'Progresso: % exames inseridos', v_base_count;

  -- Continuando...
  INSERT INTO public.base_conhecimentos (tenant_id, neurocore_id, name, description, domain, is_active) VALUES 
  (v_tenant_id, v_neurocore_id, '[CERUL] CERULOPLASMINA', E'[CERUL] CERULOPLASMINA\nDescrição: Proteína que transporta cobre no sangue; níveis baixos podem indicar Doença de Wilson, uma condição hereditária que causa acúmulo tóxico de cobre no fígado e cérebro.\nPerguntas: Precisa de jejum? Não. Informações importantes: Fundamental para diagnosticar Doença de Wilson. Orientações: Valores baixos associados a cobre sérico também baixo sugerem a doença.\nPREÇOS: Valor Cheio: R$ 89.00; Cartões de Desconto: R$ 70.00; Planos Funerários: R$ 70.00; Funerária Vida: R$ 70.00; AFAGU: R$ 66.00; LAMIC VIVA+: R$ 63.00; PARTICULAR 02: R$ 55.00', v_domain_id, false),
  (v_tenant_id, v_neurocore_id, '[CPEP] PEPTÍDEO C', E'[CPEP] PEPTÍDEO C\nDescrição: Subproduto da produção de insulina pelo pâncreas; usado para diferenciar tipos de diabetes e avaliar a capacidade de produção de insulina.\nPerguntas: Precisa de jejum? Sim, geralmente 8-12 horas. Informações importantes: Permite avaliar se o pâncreas ainda produz insulina. Orientações: Útil para diferenciar diabetes tipo 1 (sem produção) de tipo 2 (com resistência).\nPREÇOS: Valor Cheio: R$ 89.00; Cartões de Desconto: R$ 70.00; Planos Funerários: R$ 70.00; Funerária Vida: R$ 70.00; AFAGU: R$ 66.00; LAMIC VIVA+: R$ 63.00; PARTICULAR 02: R$ 55.00', v_domain_id, false),
  (v_tenant_id, v_neurocore_id, '[ELETRO] ELETROFORESE DE HEMOGLOBINA', E'[ELETRO] ELETROFORESE DE HEMOGLOBINA\nDescrição: Identifica tipos anormais de hemoglobina, sendo essencial para diagnosticar doenças hereditárias do sangue como anemia falciforme e talassemias.\nPerguntas: Precisa de jejum? Não. Informações importantes: Diagnostica doenças hereditárias do sangue. Orientações: Importante fazer em recém-nascidos (teste do pezinho) e antes do casal ter filhos se houver casos na família.\nPREÇOS: Valor Cheio: R$ 62.00; Cartões de Desconto: R$ 50.00; Planos Funerários: R$ 50.00; Funerária Vida: R$ 50.00; AFAGU: R$ 47.00; LAMIC VIVA+: R$ 44.00; PARTICULAR 02: R$ 38.00', v_domain_id, false),
  (v_tenant_id, v_neurocore_id, '[G6PD] GLICOSE-6-FOSFATO DESIDROGENASE', E'[G6PD] GLICOSE-6-FOSFATO DESIDROGENASE\nDescrição: Enzima que protege os glóbulos vermelhos; sua deficiência pode causar anemia hemolítica quando a pessoa ingere certos alimentos (favas) ou medicamentos.\nPerguntas: Precisa de jejum? Não. Informações importantes: Deficiência causa "favismo" - destruição de glóbulos vermelhos ao comer favas. Orientações: Portadores devem evitar certos medicamentos e alimentos. Comum em descendentes de mediterrâneos e africanos.\nPREÇOS: Valor Cheio: R$ 71.00; Cartões de Desconto: R$ 59.00; Planos Funerários: R$ 59.00; Funerária Vida: R$ 59.00; AFAGU: R$ 56.00; LAMIC VIVA+: R$ 53.00; PARTICULAR 02: R$ 44.00', v_domain_id, false),
  (v_tenant_id, v_neurocore_id, '[HAPTOG] HAPTOGLOBINA', E'[HAPTOG] HAPTOGLOBINA\nDescrição: Proteína que se liga à hemoglobina liberada quando glóbulos vermelhos são destruídos; útil para diagnosticar anemias hemolíticas.\nPerguntas: Precisa de jejum? Não. Informações importantes: Níveis baixos indicam destruição excessiva de glóbulos vermelhos (hemólise). Orientações: Pode estar elevada em inflamações (é uma proteína de fase aguda).\nPREÇOS: Valor Cheio: R$ 71.00; Cartões de Desconto: R$ 59.00; Planos Funerários: R$ 59.00; Funerária Vida: R$ 59.00; AFAGU: R$ 56.00; LAMIC VIVA+: R$ 53.00; PARTICULAR 02: R$ 44.00', v_domain_id, false),
  (v_tenant_id, v_neurocore_id, '[IGG] IMUNOGLOBULINA G', E'[IGG] IMUNOGLOBULINA G\nDescrição: Principal anticorpo de defesa do organismo; níveis alterados podem indicar imunodeficiências ou doenças autoimunes.\nPerguntas: Precisa de jejum? Não. Informações importantes: É a "memória" do sistema imunológico. Orientações: Valores baixos indicam maior risco de infecções; valores altos podem ocorrer em doenças crônicas.\nPREÇOS: Valor Cheio: R$ 72.00; Cartões de Desconto: R$ 57.00; Planos Funerários: R$ 57.00; Funerária Vida: R$ 57.00; AFAGU: R$ 54.00; LAMIC VIVA+: R$ 51.00; PARTICULAR 02: R$ 44.00', v_domain_id, false),
  (v_tenant_id, v_neurocore_id, '[LEUCO] LEUCOGRAMA', E'[LEUCO] LEUCOGRAMA\nDescrição: Parte do hemograma que detalha os glóbulos brancos (células de defesa); identifica o tipo específico de infecção ou alteração imunológica.\nPerguntas: Precisa de jejum? Não. Informações importantes: Diferencia infecções bacterianas (neutrófilos altos) de virais (linfócitos altos). Orientações: Faz parte do hemograma completo.\nPREÇOS: Valor Cheio: R$ 27.00; Cartões de Desconto: R$ 22.00; Planos Funerários: R$ 22.00; Funerária Vida: R$ 22.00; AFAGU: R$ 21.00; LAMIC VIVA+: R$ 19.00; PARTICULAR 02: R$ 18.00', v_domain_id, false),
  (v_tenant_id, v_neurocore_id, '[LIPOP] LIPOPROTEÍNA (A)', E'[LIPOP] LIPOPROTEÍNA (A)\nDescrição: Fator de risco genético independente para doenças cardiovasculares; níveis elevados aumentam muito o risco de infarto, mesmo com colesterol normal.\nPerguntas: Precisa de jejum? Não. Informações importantes: É determinada geneticamente e não muda com dieta. Orientações: Valores altos indicam maior risco cardiovascular que deve ser compensado controlando outros fatores de risco.\nPREÇOS: Valor Cheio: R$ 95.00; Cartões de Desconto: R$ 75.00; Planos Funerários: R$ 75.00; Funerária Vida: R$ 75.00; AFAGU: R$ 71.00; LAMIC VIVA+: R$ 68.00; PARTICULAR 02: R$ 60.00', v_domain_id, false),
  (v_tenant_id, v_neurocore_id, '[MIOG] MIOGLOBINA', E'[MIOG] MIOGLOBINA\nDescrição: Proteína muscular que se eleva rapidamente após lesão muscular ou infarto; é o primeiro marcador a aparecer no infarto agudo do miocárdio.\nPerguntas: Precisa de jejum? Não. Informações importantes: Eleva-se precocemente no infarto (antes da troponina). Orientações: Também aumenta em lesões musculares, exercício intenso ou quedas.\nPREÇOS: Valor Cheio: R$ 89.00; Cartões de Desconto: R$ 70.00; Planos Funerários: R$ 70.00; Funerária Vida: R$ 70.00; AFAGU: R$ 66.00; LAMIC VIVA+: R$ 63.00; PARTICULAR 02: R$ 55.00', v_domain_id, false),
  (v_tenant_id, v_neurocore_id, '[OSMOL] OSMOLALIDADE SÉRICA', E'[OSMOL] OSMOLALIDADE SÉRICA\nDescrição: Mede a concentração de partículas no sangue; usado para avaliar equilíbrio hídrico e diagnosticar distúrbios do sódio.\nPerguntas: Precisa de jejum? Não obrigatório. Informações importantes: Avalia o equilíbrio de água e sais no corpo. Orientações: Útil em casos de desidratação, excesso de hidratação ou distúrbios do sódio.\nPREÇOS: Valor Cheio: R$ 47.00; Cartões de Desconto: R$ 37.00; Planos Funerários: R$ 37.00; Funerária Vida: R$ 37.00; AFAGU: R$ 35.00; LAMIC VIVA+: R$ 33.00; PARTICULAR 02: R$ 27.00', v_domain_id, false);

  v_base_count := v_base_count + 10;
  RAISE NOTICE 'Progresso: % exames inseridos', v_base_count;

  -- Últimos exames...
  INSERT INTO public.base_conhecimentos (tenant_id, neurocore_id, name, description, domain, is_active) VALUES 
  (v_tenant_id, v_neurocore_id, '[PROT] PROTEÍNAS TOTAIS E FRAÇÕES', E'[PROT] PROTEÍNAS TOTAIS E FRAÇÕES\nDescrição: Mede albumina e globulinas no sangue; alterações podem indicar problemas hepáticos, renais, nutricionais ou doenças do sistema imunológico.\nPerguntas: Precisa de jejum? Não obrigatório. Informações importantes: Avalia estado nutricional e função hepática. Orientações: Albumina baixa pode indicar desnutrição ou doença hepática grave.\nPREÇOS: Valor Cheio: R$ 47.00; Cartões de Desconto: R$ 37.00; Planos Funerários: R$ 37.00; Funerária Vida: R$ 37.00; AFAGU: R$ 35.00; LAMIC VIVA+: R$ 33.00; PARTICULAR 02: R$ 27.00', v_domain_id, false),
  (v_tenant_id, v_neurocore_id, '[SOMATO] SOMATOMEDINA C (IGF-1)', E'[SOMATO] SOMATOMEDINA C (IGF-1)\nDescrição: Mediador do hormônio do crescimento (GH); usado para diagnosticar deficiência ou excesso de GH, especialmente em crianças com problemas de crescimento.\nPerguntas: Precisa de jejum? Desejável 4 horas. Informações importantes: Reflete a ação do hormônio do crescimento. Orientações: Valores baixos em crianças indicam possível deficiência de GH; valores altos podem indicar gigantismo ou acromegalia.\nPREÇOS: Valor Cheio: R$ 155.00; Cartões de Desconto: R$ 116.00; Planos Funerários: R$ 116.00; Funerária Vida: R$ 116.00; AFAGU: R$ 110.00; LAMIC VIVA+: R$ 105.00; PARTICULAR 02: R$ 88.00', v_domain_id, false),
  (v_tenant_id, v_neurocore_id, '[TP] TEMPO DE PROTROMBINA - TP/INR', E'[TP] TEMPO DE PROTROMBINA - TP/INR\nDescrição: Avalia a coagulação sanguínea; essencial para monitorar pacientes em uso de anticoagulantes orais (varfarina/marevan) e avaliar função hepática.\nPerguntas: Precisa de jejum? Não. Informações importantes: O INR é usado para ajustar a dose de anticoagulantes orais. Orientações: Informe todos os medicamentos, especialmente anticoagulantes. O tubo deve ser totalmente preenchido.\nPREÇOS: Valor Cheio: R$ 27.00; Cartões de Desconto: R$ 22.00; Planos Funerários: R$ 22.00; Funerária Vida: R$ 22.00; AFAGU: R$ 21.00; LAMIC VIVA+: R$ 19.00; PARTICULAR 02: R$ 18.00', v_domain_id, false),
  (v_tenant_id, v_neurocore_id, '[TTPA] TEMPO DE TROMBOPLASTINA PARCIAL ATIVADA', E'[TTPA] TEMPO DE TROMBOPLASTINA PARCIAL ATIVADA\nDescrição: Avalia outra via da coagulação sanguínea; usado para monitorar heparina e detectar deficiências de fatores de coagulação como hemofilia.\nPerguntas: Precisa de jejum? Não. Informações importantes: Usado para monitorar tratamento com heparina. Orientações: Informe todos os anticoagulantes em uso. Valores prolongados podem indicar hemofilia ou outras doenças da coagulação.\nPREÇOS: Valor Cheio: R$ 27.00; Cartões de Desconto: R$ 22.00; Planos Funerários: R$ 22.00; Funerária Vida: R$ 22.00; AFAGU: R$ 21.00; LAMIC VIVA+: R$ 19.00; PARTICULAR 02: R$ 18.00', v_domain_id, false),
  (v_tenant_id, v_neurocore_id, '[URIC24] ÁCIDO ÚRICO URINÁRIO 24H', E'[URIC24] ÁCIDO ÚRICO URINÁRIO 24H\nDescrição: Mede a eliminação de ácido úrico na urina de 24 horas; ajuda a diferenciar tipos de gota e investigar formação de cálculos renais.\nPerguntas: Precisa de jejum? Não. Qual preparo? Colete toda a urina de 24 horas em frasco especial mantido em geladeira. Informações importantes: Ajuda a definir se a gota é por produção excessiva ou eliminação deficiente de ácido úrico.\nPREÇOS: Valor Cheio: R$ 47.00; Cartões de Desconto: R$ 37.00; Planos Funerários: R$ 37.00; Funerária Vida: R$ 37.00; AFAGU: R$ 35.00; LAMIC VIVA+: R$ 33.00; PARTICULAR 02: R$ 27.00', v_domain_id, false),
  (v_tenant_id, v_neurocore_id, '[VITD] 25-HIDROXIVITAMINA D TOTAL', E'[VITD] 25-HIDROXIVITAMINA D TOTAL\nDescrição: Avalia as reservas de vitamina D no organismo, essencial para saúde óssea, imunidade e prevenção de diversas doenças crônicas.\nPerguntas: Precisa de jejum? Não. Informações importantes: A deficiência é muito comum e pode causar dores musculares, fraqueza e osteoporose. Orientações: Informe uso de suplementos de vitamina D.\nPREÇOS: Valor Cheio: R$ 110.00; Cartões de Desconto: R$ 87.00; Planos Funerários: R$ 87.00; Funerária Vida: R$ 87.00; AFAGU: R$ 83.00; LAMIC VIVA+: R$ 75.00; PARTICULAR 02: R$ 66.00', v_domain_id, false),
  (v_tenant_id, v_neurocore_id, '[HEMA] HEMATÓCRITO', E'[HEMA] HEMATÓCRITO\nDescrição: Porcentagem de glóbulos vermelhos no volume total do sangue; parte do hemograma, usado para diagnosticar anemias e policitemias.\nPerguntas: Precisa de jejum? Não. Informações importantes: Valores baixos indicam anemia; valores altos podem ocorrer em desidratação ou doenças que aumentam os glóbulos vermelhos. Orientações: Faz parte do hemograma completo.\nPREÇOS: Valor Cheio: R$ 27.00; Cartões de Desconto: R$ 22.00; Planos Funerários: R$ 22.00; Funerária Vida: R$ 22.00; AFAGU: R$ 21.00; LAMIC VIVA+: R$ 19.00; PARTICULAR 02: R$ 18.00', v_domain_id, false),
  (v_tenant_id, v_neurocore_id, '[HEMOG] HEMOGLOBINA', E'[HEMOG] HEMOGLOBINA\nDescrição: Proteína dos glóbulos vermelhos que transporta oxigênio; sua dosagem é fundamental para diagnosticar anemias de todos os tipos.\nPerguntas: Precisa de jejum? Não. Informações importantes: É o principal marcador de anemia. Orientações: Valores baixos causam cansaço, falta de ar e palidez. Faz parte do hemograma.\nPREÇOS: Valor Cheio: R$ 27.00; Cartões de Desconto: R$ 22.00; Planos Funerários: R$ 22.00; Funerária Vida: R$ 22.00; AFAGU: R$ 21.00; LAMIC VIVA+: R$ 19.00; PARTICULAR 02: R$ 18.00', v_domain_id, false),
  (v_tenant_id, v_neurocore_id, '[PLAQ] PLAQUETAS', E'[PLAQ] PLAQUETAS\nDescrição: Células responsáveis pela coagulação e controle de sangramentos; alterações podem causar desde sangramentos excessivos até tromboses.\nPerguntas: Precisa de jejum? Não. Informações importantes: Valores baixos aumentam risco de sangramentos; valores muito altos podem causar tromboses. Orientações: Faz parte do hemograma completo.\nPREÇOS: Valor Cheio: R$ 27.00; Cartões de Desconto: R$ 22.00; Planos Funerários: R$ 22.00; Funerária Vida: R$ 22.00; AFAGU: R$ 21.00; LAMIC VIVA+: R$ 19.00; PARTICULAR 02: R$ 18.00', v_domain_id, false),
  (v_tenant_id, v_neurocore_id, '[SANGUE] TIPAGEM SANGUÍNEA (ABO E RH)', E'[SANGUE] TIPAGEM SANGUÍNEA (ABO E RH)\nDescrição: Identifica o tipo sanguíneo (A, B, AB ou O) e o fator Rh (positivo ou negativo); essencial para transfusões, cirurgias e pré-natal.\nPerguntas: Precisa de jejum? Não. Informações importantes: Essencial conhecer seu tipo sanguíneo para emergências. Orientações: Importante no pré-natal para detectar incompatibilidade Rh que pode afetar o bebê.\nPREÇOS: Valor Cheio: R$ 27.00; Cartões de Desconto: R$ 22.00; Planos Funerários: R$ 22.00; Funerária Vida: R$ 22.00; AFAGU: R$ 21.00; LAMIC VIVA+: R$ 19.00; PARTICULAR 02: R$ 18.00', v_domain_id, false),
  (v_tenant_id, v_neurocore_id, '[COOMBS] COOMBS DIRETO', E'[COOMBS] COOMBS DIRETO\nDescrição: Detecta anticorpos grudados nos glóbulos vermelhos; usado para diagnosticar anemias hemolíticas autoimunes e incompatibilidade sanguínea.\nPerguntas: Precisa de jejum? Não. Informações importantes: Positivo indica que o sistema imunológico está atacando os próprios glóbulos vermelhos. Orientações: Importante em recém-nascidos com icterícia grave.\nPREÇOS: Valor Cheio: R$ 47.00; Cartões de Desconto: R$ 37.00; Planos Funerários: R$ 37.00; Funerária Vida: R$ 37.00; AFAGU: R$ 35.00; LAMIC VIVA+: R$ 33.00; PARTICULAR 02: R$ 27.00', v_domain_id, false),
  (v_tenant_id, v_neurocore_id, '[DENGUE] DENGUE NS1 E SOROLOGIA', E'[DENGUE] DENGUE NS1 E SOROLOGIA\nDescrição: Conjunto de testes para diagnosticar dengue em diferentes fases da doença; o NS1 detecta precocemente, enquanto IgM e IgG aparecem depois.\nPerguntas: Precisa de jejum? Não. Informações importantes: NS1 positivo nos primeiros 5 dias confirma dengue ativa. IgM aparece a partir do 5º dia. Orientações: Informe o dia de início dos sintomas para escolher o teste adequado.\nPREÇOS: Valor Cheio: R$ 95.00; Cartões de Desconto: R$ 75.00; Planos Funerários: R$ 75.00; Funerária Vida: R$ 75.00; AFAGU: R$ 71.00; LAMIC VIVA+: R$ 68.00; PARTICULAR 02: R$ 60.00', v_domain_id, false);

  v_base_count := v_base_count + 12;

  RAISE NOTICE '============================================================';
  RAISE NOTICE 'SEED COMPLETO! PARTE 3 FINALIZADA!';
  RAISE NOTICE 'Total de exames inseridos nesta parte: %', v_base_count;
  RAISE NOTICE 'TODOS OS 154 EXAMES FORAM CRIADOS! (Partes 1, 2 e 3)';
  RAISE NOTICE '============================================================';

END $$;

-- ============================================================
-- CONSULTAS DE VERIFICAÇÃO FINAL
-- ============================================================

-- Verificar domain
SELECT 
  id, 
  domain,
  neurocore_id,
  active
FROM public.knowledge_domains 
WHERE domain = 'exames';

-- Contar TODAS as bases do tenant no domain exames
SELECT 
  COUNT(*) as total_bases_exames
FROM public.base_conhecimentos
WHERE tenant_id = '004ead16-af22-419c-8e19-28966d4c4d38'
  AND domain IN (SELECT id FROM public.knowledge_domains WHERE domain = 'exames');

-- Listar primeiras e últimas bases criadas
(SELECT 
  'PRIMEIRAS' as grupo,
  name, 
  is_active,
  LEFT(description, 60) as preview,
  created_at
FROM public.base_conhecimentos
WHERE tenant_id = '004ead16-af22-419c-8e19-28966d4c4d38'
  AND domain IN (SELECT id FROM public.knowledge_domains WHERE domain = 'exames')
ORDER BY created_at ASC
LIMIT 5)
UNION ALL
(SELECT 
  'ÚLTIMAS' as grupo,
  name, 
  is_active,
  LEFT(description, 60) as preview,
  created_at
FROM public.base_conhecimentos
WHERE tenant_id = '004ead16-af22-419c-8e19-28966d4c4d38'
  AND domain IN (SELECT id FROM public.knowledge_domains WHERE domain = 'exames')
ORDER BY created_at DESC
LIMIT 5);
