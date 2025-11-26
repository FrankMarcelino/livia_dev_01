-- ============================================
-- SEED: Quick Reply Templates - Signum Cursos
-- Tenant ID: 31701213-794d-43c3-a74a-50d57fcd9d2b
-- Executar no Supabase SQL Editor
-- ============================================

-- Limpar mensagens rápidas existentes deste tenant (opcional - comente se não quiser limpar)
-- DELETE FROM quick_reply_templates WHERE tenant_id = '31701213-794d-43c3-a74a-50d57fcd9d2b';

-- Inserir mensagens rápidas
INSERT INTO quick_reply_templates (tenant_id, title, message, icon, usage_count) VALUES

-- ============================================
-- 🙋 Saudações
-- ============================================
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'BomDia', 'Bom dia, td bem?', '☀️', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'BoaNoite', 'Boa noite, td bem?', '🌙', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'BemVindo', 'Seja muito bem-vindo a Signum Cursos', '👋', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'BemVinda', 'Seja muito bem-vinda a Signum Cursos', '👋', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'OkObrigado', 'Ok, obrigado', '👍', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'Perfeito', 'Perfeito, vou te passar as informações', '✅', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'Perfeito2', 'Perfeito, vou te enviar, é bem simples, basta digitar os dados pra mim', '✅', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'VouTeEnviar', 'Ok, vou te enviar as informações', '📤', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'VouTeEnviar2', 'Vou te enviar as informações', '📤', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'Fico2', 'Fico aguardando o seu retorno', '⏳', 0),

-- ============================================
-- ℹ️ Informações Gerais
-- ============================================
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'SomosSBC', 'Somos de São Bernardo do Campo/SP, porém temos o curso Online que possui os mesmos módulos e professores do presencial, inclusive o Online também possui Aulas Práticas dentro do necrotério e custa 50% menos do que o curso presencial. Temos vários alunos e alunas da sua região. Posso te apresentar como funciona o curso Online?', 'ℹ️', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'MesmoCurso', 'O curso Online é idêntico ao curso Presencial, uma vez que possui os mesmos professores, a mesma carga horária, o mesmo material didático, o mesmo certificado e também possui estágio dentro do necrotério. Posso te passar as informações do curso Online?', 'ℹ️', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'Unica', 'Sim, entendi. Mas na sua pesquisa leve em consideração que somos a única escola do Brasil a ministrar 8 profissões dentro do curso de Ciências Mortuárias, ta bom? Somos também os Autores dessa Metodologia de Ensino, e ministramos 4 horas de curso por semana e não apenas 2 horas por semana como muitas escolas fazem. E além disso não cobramos taxa de matrícula e nem de material didático, ta bom?', '🏆', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'Unica1', 'Sim, entendi. Mas na sua pesquisa leve em consideração que somos a única escola do Brasil a ministrar 8 profissões dentro do curso de Ciências Mortuárias, ta bom? Somos também os Autores dessa Metodologia de Ensino, e ministramos 4 horas de curso por semana e não apenas 2 horas por semana como muitas escolas fazem. E além disso não cobramos taxa de matrícula e nem de material didático, ta bom?', '🏆', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'SemTaxaMatrícula', 'Não cobramos taxa de matrícula e nem de material didático', '💰', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'Celular', 'O curso é ministrado de forma digital pela plataforma Zoom, por isso te passei as informações desse formato, pq daí vc pode assistir as aulas pelo seu computador ou pelo seu celular, ta bom?', '📱', 0),

-- ============================================
-- 💻 Curso Online
-- ============================================
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'TurmasAoVivo', 'Horários das turmas do curso Online

Das 5 turmas abaixo preciso que vc escolha apenas 1 turma, ok?

- Segunda e quarta - 8h às 10h
- Segunda e quarta - 17h às 19h
- Terça e quinta - 21h às 23h
- Sábado - 8h às 12h
- Domingo - 8h às 12h', '💻', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'SaberComoFunciona', 'Entendi, não quer mesmo saber como funciona o curso Online? Temos vários alunos e alunas do seu Estado estudando conosco!', '💻', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'Rotatividade', 'Para vc entender melhor como funciona o nosso curso, imagine uma roda gigante. Você pode subir em qualquer ponto da roda, porque ela vai girar e te levar por todos os módulos, até você completar o ciclo, entendeu? Ou seja, não importa por qual módulo você inicie o curso, porque todos os alunos vão ver todos os conteúdos do curso, sem perder nada. Os módulos são independentes e rotativos, e a cada semana, pessoas novas entram, outras estão se formando, mas todos passam pelos mesmos temas. Você vai estudar tudo, veja:

👉 Anatomia
👉 Medicina Legal
👉 Técnicas de Necropsia
👉 Biossegurança
👉 Papiloscopia
👉 Agente Funerário
👉 Tanatopraxia
👉 Necromaquiagem
👉 Reconstrução Facial
👉 Cremação
👉 Atendente de Velório
👉 Mercado de Trabalho

Então pode ficar tranquilo(a) porque você vai receber 100% do conteúdo, com a vantagem de poder começar imediatamente, sem esperar uma nova turma fechar, ta bom?', '🎡', 0),

-- ============================================
-- 🏫 Curso Presencial
-- ============================================
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'PresencialCurso', 'Nosso curso presencial é ministrado em São Bernardo do Campo/SP', '🏫', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'PossoPresencial', 'Posso te passar as informações do curso presencial?', '🏫', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'Endereço2', 'Vc quer fazer uma visita ao nosso espaço, é isso? Ou quer o endereço somente para ter uma noção da distância?', '📍', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'VisitaEscola', 'Você pode sim conhecer o nosso espaço, estamos localizados na Rua Rio Branco, 45 - Centro - São Bernardo do Campo, ta bom? Porém a matrícula é feita toda digitalmente, depois da pandemia a gente nunca mais teve atendimento presencial, tanto é que sou funcionário do setor comercial mas estou trabalhando neste exato momento da minha casa, entendeu? O horário de atendimento do setor administrativo é de segunda a sexta-feira das 8h às 17h ok? Lembrando que o setor administrativo apenas te apresentará o nosso espaço físico, porém a matrícula é feita toda por aqui ok?', '🏢', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'Agendamento', 'Sabe me dizer o dia e o horário que vc irá visitar a escola para que eu possa avisar a secretaria?', '📅', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'ValeTransporte', 'Não solicitamos, mas tem alunos que levam o formulário já preenchido na escola e o diretor assina. Só não sei te falar como vc emite essa documentação ta bom? Aí vc precisará se informar ta bom?', '🎫', 0),

-- ============================================
-- 🔬 Estágio Prático
-- ============================================
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'Estagio', 'Os estágios não são obrigatórios ok? De qq forma vou te passar onde ele é realizado ok?', '🔬', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'FormatoEstágio', '**Estágio Prático (Opcional e Flexível/Não é Obrigatório)**

➡️ Após os 10 meses de teoria, você poderá participar de 2 dias de prática em necrotério (10h totais).

✔ Experiência real e enriquecedora
✔ Certificado exclusivo do Estágio
✔ Possibilidade de ampliar a carga prática (4, 6, 8, 10 idas ou mais)

👉 O melhor: você pode escolher a forma que se encaixa na sua realidade. Temos alternativas para quem mora perto e para quem está em outras regiões.

**Investimento:** apenas 10x de R$49,00.', '🔬', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'Programar', 'O Estágio Prático é aqui na grande São Paulo, porém vc virá para realizá-lo somente daqui 10 meses, momento em que vc terminará o curso teórico, portanto vc tem tempo para se programar e vir, entendeu? E essas 10 horas de estágio também podem ser realizadas num único dia, portanto vc pode realizar o estágio num único dia e já retornar para a sua cidade, ta bom?', '📅', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'OutraPossibilidade', 'Caso não queira vir a São Paulo para realizar os Estágios Práticos, outra possibilidade é após vc se formar em nosso curso, eu posso também emitir uma autorização e vc procurar por conta própria uma instituição que te dê estágio aí na sua cidade, como IML ou funerárias, caso vc queira muito o estágio, entendeu? Mas nessa proposta vc deverá procurar os Estágios Práticos por conta própria, ok?', '🔬', 0),

-- ============================================
-- 📝 Matrícula e Documentação
-- ============================================
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'PreMatrícula', 'Entendi, então vamos fazer assim, digita aqui pra mim seu nome completo, CPF, data de nascimento, email e endereço com CEP, que vou fazer a sua pré-matrícula que é mais rápida, e depois vc me envia as fotos da documentação, pode ser?', '📝', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'PreMatricula3', 'Digita aqui pra mim seu nome completo, RG, CPF, data de nascimento, email e endereço com CEP, por favor!', '📝', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'Pre2', 'Se estiver difícil para enviar as fotos agora, então vamos fazer assim, digita aqui pra mim seu nome completo, CPF, data de nascimento, email e endereço com CEP, que vou fazer a sua pré-matrícula que é mais rápida, e depois vc me envia as fotos da documentação, pode ser?', '📝', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'CEP', 'Caso o comprovante de endereço esteja difícil agora, faz assim, digita aqui pra mim o seu endereço, a rua, o bairro, a cidade e o CEP, que já ajuda bastante e depois vc envia a foto dele, ta bom?', '📮', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'Secretaria', 'Em breve a secretaria irá entrar em contato com vc para te enviar o link do contrato e do informativo para vc assiná-los, ta bom?', '📧', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'SecretariaEnvioDocumetos', 'A secretaria entrará em contato com vc em breve para te enviar o link do contrato e informativo para vc assinar digitalmente, ta bom?', '📧', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'Secretaria1', 'Sobre esse assunto pode falar com a secretaria, ta bom? Eles atendem de segunda a sexta das 8h às 17h, ok? Vou te passar o contato deles', '📞', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'Secretaria4', 'Fechamos muitas matrículas todos os dias e a secretaria tem muitas matrículas para lançar no sistema, mas ainda hj falarão com vc ta bom?', '⏰', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'currículo', 'signumcursos@gmail.com', '📧', 0),

-- ============================================
-- 💰 Valores e Pagamento
-- ============================================
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'ValoresAoVivoImersão', 'Daí fica 10 parcelas de R$194,35 referente às aulas teóricas e 10 parcelas de 49,00 referente ao Estágio Prático, total de R$243,35 por mês', '💰', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'NãoPerderDesconto', 'Vamos fazer assim, vc fecha a matrícula hj para não perder o desconto de 35% e o pagamento da primeira parcela ponho o boleto para vc pagar mês que vem, entendeu? Podemos prosseguir assim?', '💸', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'NãoPerderDesconto2', 'Vamos fazer assim, vc fecha a matrícula hj para não perder o desconto de 35% e o pagamento da primeira parcela ponho o boleto para vc pagar no dia 15/12, e daí vc inicia o curso em janeiro de 2026, podemos prosseguir assim?', '💸', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'Promoção', 'Para vc aproveitar e não perder essa super promoção de 35% de desconto, vou colocar o primeiro boleto para pagamento na próxima segunda-feira, dia 01/12, td bem?', '🎉', 0),

-- ============================================
-- 📚 Carga Horária e Funcionamento
-- ============================================
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'CargaHorária', 'São 4 horas semanais que dão 16 horas mensais, somando um total de 160 horas de curso, ok?', '📚', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'CargaHorária3', 'De semana são 2 horas num dia e 2 horas no outro dia, e de final de semana as 4 horas são num único dia entendeu?', '📚', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'InicioCurso', 'Para te passar a informação de quando inicia eu preciso antes que vc escolha uma turma, ta bom?', '📅', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'Inicia', 'Vou te passar a data de quando vc inicia o curso ok?', '📅', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'MelhorTurma', 'Qual é a turma que melhor te atende?', '❓', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'Data', 'Entendi, e qual data fica melhor para vc?', '📅', 0),

-- ============================================
-- 💼 Mercado de Trabalho
-- ============================================
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'Garra', 'Essa área das Ciências Mortuárias possui muitas vagas de trabalho, porém temos de levar em conta também a garra e a determinação de cada pessoa para ir atrás do emprego, entendeu? Vou te enviar um Ebook para vc ver como tem muitas funções que a pessoa pode trabalhar. Dessas quase 30 profissões que estão no Ebook, a maior parte é no setor privado (empresas particulares), ta bom?', '💼', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'Garra2', 'Essa área das Ciências Mortuárias possui muitas vagas de trabalho, porém temos de levar em conta também a garra e a determinação de cada pessoa para ir atrás do emprego, entendeu?', '💼', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'Idade', 'Não há um limite com exatidão para vc trabalhar nas áreas das Ciências Mortuárias, vc pode trabalhar tanto no setor público quanto no setor privado, em funerárias, clínicas de tanatopraxia, crematórios, cemitérios parque etc. Para vc ter uma ideia o concurso da Polícia Civil permite que pessoas até 75 anos prestem o concurso', '👴', 0),

-- ============================================
-- ❓ Perguntas e Esclarecimentos
-- ============================================
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'MuitasInformações', 'Para não te passar muitas informações de uma única vez, primeiro te passei as informações do curso Online e assim que me autorizar passo as informações do curso Presencial td bem? Ficou alguma dúvida referente ao curso Online?', '❓', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'Dois', 'Vc quer se matricular nos dois?', '❓', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'Dois2', 'Vc quer as informações dos dois formatos, é isso?', '❓', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'DoisTeoricoPratico', 'Quer se matricular no curso teórico e no estágio? Ou somente no curso teórico?', '❓', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'QualFormato', 'Quer se matricular no curso teórico e no estágio? Ou quer se matricular somente no curso teórico?', '❓', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'QualDelas', 'Qual delas?
- Sábado - 08h às 12h
- Sábado - 13h às 17h', '❓', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'Menores2', 'Qualquer pessoa maior de idade pode se matricular no curso. Já os menores com 16 e 17 anos somente com a autorização de um responsável, ok?', '👶', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'NívelEscolar', 'Com o fundamental ou médio a pessoa já pode fazer o curso conosco!', '🎓', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'Retorno2', 'E vc já consegue me dar um retorno?', '⏰', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'OQueFalta', 'O que falta para vc fechar a sua matrícula conosco? Me fala para eu ver de que forma posso te ajudar', '❓', 0),
('31701213-794d-43c3-a74a-50d57fcd9d2b', 'PolíticaEmpresa', 'Umas das políticas da empresa é realizar o atendimento por escrito para que tudo fique registrado no whatsapp ok? Mas vc pode me enviar áudios que escuto e te respondo, ta bom?', '📝', 0)

ON CONFLICT DO NOTHING;

-- ============================================
-- Verificar resultado
-- ============================================
SELECT
  COUNT(*) as total_mensagens
FROM quick_reply_templates
WHERE tenant_id = '31701213-794d-43c3-a74a-50d57fcd9d2b';

-- Ver todas as mensagens inseridas
SELECT
  id,
  title,
  icon,
  LEFT(message, 50) as message_preview,
  usage_count,
  created_at
FROM quick_reply_templates
WHERE tenant_id = '31701213-794d-43c3-a74a-50d57fcd9d2b'
ORDER BY title;

-- ============================================
-- TOTAL ESPERADO: 69 mensagens rápidas
-- ============================================
