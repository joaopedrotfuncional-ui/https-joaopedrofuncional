# JP Sports — inscrições e painel administrativo

Site estático para GitHub Pages com persistência em Google Sheets via Google Apps Script.

## Funcionalidades
- Formulário público para inscrição no Treinão Novembro Azul do JP.
- Registro de inscritos na planilha Google vinculada ao Apps Script.
- Painel ADM com criação inicial de senha, login, consulta e exportação CSV.
- Sem Supabase.

## Publicação
Siga o passo a passo completo em [`LEIA-ME.txt`](./LEIA-ME.txt). Configure a URL `/exec` do Web App em `config.js` antes de publicar.

## Arquivos
- `index.html`, `styles.css`, `app.js`: interface.
- `config.js`: URL pública do Web App Apps Script.
- `Code.gs`: backend a ser colado no editor Apps Script da planilha.

## Dados do evento
29/11/2026, Mercado da Torre — Live; concentração 05:00; largada 05:30; 3 km e 5 km. Pacotes: R$ 59,90 sem camisa e R$ 99,90 com camisa.
