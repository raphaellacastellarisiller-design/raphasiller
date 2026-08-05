# Imagens do site

Esta pasta é o lugar para as fotos e artes reais da Siller Mídias Sociais.

Onde trocar os placeholders (blocos de cor em moldura polaroid) por fotos reais:

- **Hero** (`index.html`, classe `ph-1`): foto de destaque da Raphaella.
- **Sobre** (`ph-2`, `ph-3`): fotos de apoio na seção "Sobre".
- **Portfólio** (`ph-4`, `ph-5`, `ph-6` e repetições): trabalhos reais — registros orgânicos, artes, capturas de vídeo/stories.

Passo a passo:
1. Coloque os arquivos de imagem nesta pasta (ex: `foto-hero.jpg`).
2. No `css/style.css`, troque o `background: linear-gradient(...)` da classe correspondente (ex: `.ph-1`) por `background: url('../assets/images/foto-hero.jpg') center/cover;`.
