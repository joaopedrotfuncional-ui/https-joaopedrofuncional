# JP Sports — Plataforma de inscrições

Plataforma estática de inscrições para eventos JP Sports, com painel administrativo e integração com Supabase.

## Publicar no GitHub Pages

Este projeto foi adaptado para funcionar em um repositório de projeto do GitHub Pages, no endereço:

`https://joaopedrotfuncional-ui.github.io/https-joaopedrofuncional/`

1. Extraia o ZIP e abra a pasta `jp_sports_netlify`.
2. Envie **todos os arquivos que estão dentro dessa pasta** para a raiz do repositório `https-joaopedrofuncional` (não envie a pasta `jp_sports_netlify` como uma subpasta).
3. Confirme que `index.html`, `app.js`, `styles.css` e `config.js` aparecem diretamente na raiz do repositório.
4. No GitHub, abra **Settings → Pages**.
5. Em **Build and deployment**, selecione **Deploy from a branch**, branch `main` e pasta `/(root)`, depois salve.
6. Aguarde o GitHub Pages concluir a publicação.

O arquivo `.nojekyll` evita que o Jekyll ignore arquivos e diretórios do site. Os caminhos dos recursos são relativos, para funcionar no subdiretório do projeto.

## Endereços

- Página pública: `https://joaopedrotfuncional-ui.github.io/https-joaopedrofuncional/`
- Painel administrativo: `https://joaopedrotfuncional-ui.github.io/https-joaopedrofuncional/?admin=1`

O GitHub Pages não oferece rotas de servidor como `/admin`; por isso o painel usa o parâmetro `?admin=1`.

## Configurar Supabase

1. No Supabase, execute todo o arquivo `schema.sql` no **SQL Editor**.
2. Em **Authentication → URL Configuration**, configure a `Site URL` para `https://joaopedrotfuncional-ui.github.io`.
3. Adicione às Redirect URLs permitidas o endereço completo do site e o endereço do painel:
   - `https://joaopedrotfuncional-ui.github.io/https-joaopedrofuncional/`
   - `https://joaopedrotfuncional-ui.github.io/https-joaopedrofuncional/?admin=1`
4. Em **Project Settings → API**, copie a Project URL e a chave pública `anon`/publishable.
5. Edite `config.js` e substitua os dois valores de exemplo.
6. Envie o `config.js` atualizado para a raiz do repositório.
7. Em **Authentication → Providers → Email**, habilite o provedor de e-mail.
8. Abra o painel pelo endereço com `?admin=1` e use **Criar minha senha de administrador**.

Exemplo de `config.js`:

```js
window.JP_CONFIG = {
  SUPABASE_URL: "https://SEU-PROJETO.supabase.co",
  SUPABASE_ANON_KEY: "SUA_CHAVE_PUBLICA"
};
```

Nunca coloque `service_role`, secret key, senha do banco ou tokens privados no navegador ou no GitHub. A chave pública só deve ser usada com as políticas RLS e funções seguras do `schema.sql` corretamente configuradas.

## Funcionalidades

- Página pública para consultar o evento ativo e realizar inscrições.
- Seleção de distância e pacote, com tamanho de camisa condicional.
- Registro por função RPC segura no Supabase.
- Painel administrativo para gerenciar eventos, pagamentos e inscrições.
- Exportação de inscritos em CSV.
- Configuração de Pix, WhatsApp e checkout externo.
- Criação e recuperação de senha do administrador pelo Supabase Auth.

## Licença

Consulte `LICENSE`. Todos os direitos reservados à JP Sports.
