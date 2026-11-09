# JP Sports — inscrições pelo WhatsApp

Site estático para GitHub Pages. O formulário prepara uma mensagem para o WhatsApp da organização e salva uma cópia local da solicitação no navegador do participante.

## Publicação no GitHub Pages
1. Envie todos os arquivos desta pasta para a raiz do repositório.
2. Em **Settings → Pages**, selecione **Deploy from a branch**, branch `main` e pasta `/(root)`.
3. Aguarde a publicação.

## Área administrativa
Clique em **Área ADM**. No primeiro acesso daquele navegador, crie uma senha com pelo menos 8 caracteres. Depois, use essa senha para abrir o painel. É possível consultar os registros locais, atualizar o status de pagamento e exportar CSV.

## Limitação importante do modo sem servidor
Sem banco de dados ou backend, o navegador não consegue enviar automaticamente os registros do formulário para uma lista centralizada. Os dados do painel ficam no `localStorage` do navegador/dispositivo em que a inscrição foi preenchida. Assim, registros feitos no celular do participante **não aparecem** no computador do administrador. A inscrição também abre o WhatsApp com a mensagem pronta, mas o participante precisa apertar **Enviar** no WhatsApp.

A senha do painel é uma barreira de conveniência local, não uma autenticação segura de servidor. Não armazene dados altamente sensíveis nesta versão. Limpar os dados do navegador pode apagar a lista e a senha. Para uma lista única acessível de vários dispositivos, será necessário um backend/serviço de armazenamento.

## Evento configurado
Treinão Novembro Azul do JP — 29/11/2026, Mercado da Torre – Live. Concentração 05:00, largada 05:30. Distâncias 3 km e 5 km. Sem camisa R$ 59,90; com camisa azul R$ 99,90. Pix: 52.244.653/0001-10. WhatsApp: +55 81 99951-0223.
