# Yus Beauty — site

Site de vendas (landing page) da Yus Beauty, marca de cosméticos à base de juçara.
Site estático (HTML, CSS e JavaScript puros, sem build) com carrinho de compras e
finalização de pedido via WhatsApp.

## Estrutura

```
index.html            página única do site
assets/css/style.css   estilos (paleta, tipografia, layout, responsividade)
assets/js/main.js      menu mobile, carrinho, scroll reveal e checkout no WhatsApp
```

## Antes de publicar — configure estes 3 itens

1. **WhatsApp da loja** — abra `assets/js/main.js` e troque o número em
   `WHATSAPP_NUMBER` (linha ~9) pelo WhatsApp real, no formato
   `55` + DDD + número, só dígitos. Ex.: `5511987654321`.
2. **Instagram** — no mesmo arquivo, troque `INSTAGRAM_URL` pelo link do perfil.
3. **E-mail de contato** — no `index.html`, procure `contato@yusbeauty.com.br`
   (seção do rodapé) e troque pelo e-mail real, se for diferente.

## Sobre os ingredientes

Os ingredientes do Gloss e do Blush foram listados exatamente como enviados,
com uma interpretação: entendi "manteiga de Caité" como **manteiga de Karité**
(shea), por ser o ingrediente cosmético mais comum com nome parecido. Se não for
isso, é só ajustar o texto nas duas listas de ingredientes dentro do `index.html`
(procure por "karité").

## Sobre a logo e as fotos dos produtos

As imagens que você enviou na conversa (logo e fotos do gloss/blush) não ficam
acessíveis como arquivo para o site — por isso a logo "Yus Beauty" e as
ilustrações dos produtos na página foram recriadas em SVG, usando a mesma
paleta roxo/ameixa e os elementos de folha e juçara das suas fotos. Para usar
as fotos reais:

1. Salve os arquivos de imagem (logo em `.svg` ou `.png`, fotos dos produtos
   em `.jpg`/`.png`) dentro de `assets/img/`.
2. No `index.html`, troque os blocos `<svg>...</svg>` correspondentes por
   `<img src="assets/img/seu-arquivo.png" alt="...">`.

## Como visualizar localmente

Qualquer servidor estático simples funciona, por exemplo:

```bash
python3 -m http.server 8080
```

Depois acesse `http://localhost:8080` no navegador.

## Como publicar

O site é 100% estático, então pode ser hospedado gratuitamente em serviços como
GitHub Pages, Netlify ou Vercel — basta apontar para a pasta raiz deste projeto.

## Preços atuais

- Gloss Yus Beauty — R$ 15,99
- Blush Yus Beauty — R$ 29,90

Para alterar preços, edite os atributos `data-price` dos botões "Adicionar ao
carrinho" e o texto da classe `.price`, em `index.html`.
