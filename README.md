# Site de psicologia — primeira proposta

Projeto de portfólio em HTML, CSS e JavaScript, sem bibliotecas, instalação ou etapa de build. Helena Costa é uma profissional fictícia. A agenda demonstra a escolha de modalidade, data e horário, revisão e conclusão; não reserva consultas, coleta dados pessoais ou envia informações.

## Executar

Na pasta do projeto, rode `python3 -m http.server 4173 --directory dist` e abra <http://localhost:4173>. Também é possível abrir `dist/index.html` diretamente.

## Revisar o código em conjunto

1. **`dist/index.html`**: conteúdo, títulos, navegação por âncoras, campos nativos e modal de revisão. Começar pelo bloco `.hero` permite discutir a hierarquia antes das interações.
2. **`dist/styles.css`**: cores e fontes em `:root`, componentes, layouts com Grid/Flex e ajustes para telas menores. Fontes do sistema evitam downloads externos.
3. **`dist/script.js`**: horários demonstrativos, validação de datas, atualização do resumo e estados do modal. Os dias são calculados a partir de Brasília; a seleção de datas permanece independente do fuso do visitante.

Nesta rodada, avaliar a paleta, a combinação de fontes, a proporção entre texto e imagem e a clareza do agendamento. Nome, imagem, textos e estilo ainda são propostas para revisão.

## Limite da demonstração

Os quatro horários são fictícios e aparecem em qualquer dia útil entre amanhã e os próximos 90 dias. Não há integração com calendário ou serviço de reservas. Um agendamento real depende de um serviço que verifique disponibilidade e registre solicitações; essa integração está fora desta primeira versão.

## Imagem

Fotografia ilustrativa de Zara Johnson, usada sob a licença do Unsplash. Não representa um consultório real da personagem.

- Origem: <https://unsplash.com/photos/a-modern-hallway-with-a-chair-by-the-window-qraqqY9i860>
- Licença: <https://unsplash.com/license>
- Arquivo: `dist/assets/consultorio.jpg`
