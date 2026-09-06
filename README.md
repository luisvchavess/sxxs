# Gabriel Juste — link bio

Landing page tipo *link in bio*: um hub central com boas-vindas, os dois caminhos
principais (orçamento e aluno), a prova social de **+2.500 alunos** e os cinco
cursos e materiais em cards.

Site estático: `index.html` + `styles.css`. Sem framework, sem build, sem
dependências. É só abrir o arquivo ou subir os dois arquivos em qualquer
hospedagem estática.

```bash
# para ver localmente
python3 -m http.server 8000
# depois abra http://localhost:8000
```

## Direção visual — "Grifo"

O nome vem do gesto da marca: **roxo e amarelo nunca viram tinta, eles chegam
por trás das palavras** como traços de marca-texto. Isso resolve a tensão do
briefing — "todo o texto em verde escuro" **e** "destaques em roxo vibrante e
amarelo forte" — sem trair nenhum dos dois lados. Todo glifo continua
`#10231B`; a cor aparece em cheio, grande, seis vezes na página.

O logo é o mesmo gesto: um quadrado de tinta com uma cápsula amarela inclinada.
A mesma marca reaparece, pequena, no canto de cada uma das cinco capas.

### Regras de cor (não quebrar)

1. **O amarelo é superfície, nunca texto.** `#FFD429` sobre o creme dá 1,27:1.
   Por isso não existe uma variável `--text-yellow` no CSS — qualquer objeto
   amarelo carrega tinta verde por cima.
2. **Nunca tinta sobre roxo sólido** (2,35:1). O roxo cheio só carrega texto
   creme; a tinta vai sobre os tons `--purple-mark`.
3. **A sombra é semântica.** O "lip" duro, sem blur, aparece *só* em elemento
   clicável (`.btn`) — o botão anda exatamente a altura do próprio lip e encosta
   no papel quando pressionado. Todo o resto usa as sombras suaves `--air-*`.
   Um lip em qualquer lugar da página quer dizer "aperte aqui".

### Paleta

| token | valor | uso |
|---|---|---|
| `--bg` | `#F7F1E4` | papel quente, fundo da página |
| `--bg-alt` | `#EFE4D0` | areia, faixa do +2.500 |
| `--surface` | `#FFFCF5` | card |
| `--ink` | `#10231B` | títulos e corpo |
| `--ink-2` / `--ink-3` | `#3E5B4C` / `#4A6558` | texto secundário, kickers |
| `--purple` | `#6B21E8` | CTA primário, bloco, capas |
| `--yellow` | `#FFD429` | grifos, CTA secundário, lip dos cards |
| `--amber` | `#A87400` | borda e lip do amarelo |

Tipografia: uma família só (`ui-rounded` → `Varela Round` → `Nunito` →
`Quicksand` → `Arial Rounded MT Bold` → Segoe/system). Nenhuma requisição de
rede: os papéis se separam por escala, peso e entreletra, nunca por um segundo
tipo.

### O grifo, na marcação

```html
<span class="grifo"><span>palavra</span></span>
```

O `span` interno **não é opcional** — sem ele o traço passa por cima do texto.
`--sweep` já vale `1` no CSS, então sem JS, com JS bloqueado ou com movimento
reduzido o grifo simplesmente aparece desenhado. O único script da página só
anima esse traço quando ele entra na tela.

## Acessibilidade

- Os 31 pares de contraste (texto e não-texto) foram calculados e passam em
  WCAG AA; a maioria em AAA.
- Landmarks, ordem de títulos sem pulos, link "pular para o conteúdo",
  `:focus-visible` em tudo (amarelo dentro da faixa escura, onde o roxo daria
  1,87:1), alvos de toque de 44–56px.
- `prefers-reduced-motion` desliga as transições mas **mantém** o estado de
  pressão do botão: saber que o toque foi registrado é informação, não
  decoração.
- Bloco `forced-colors` para o modo de alto contraste do Windows.
- Sem rolagem horizontal de 320px a 2560px.

## Antes de publicar

1. **Trocar os links.** `grep TROCAR- index.html` lista os 11 endereços
   provisórios (orçamento, os cinco cards, e-mail e as redes). São fragmentos
   inexistentes de propósito: ao contrário de `href="#"`, um fragmento que não
   casa com nada **não** rola a página, então nenhum clique joga o visitante de
   volta ao topo enquanto os links não entram. "Quero ser aluno" já aponta para
   `#cursos`, que existe nesta página.
2. **Confirmar o texto marcado com `CONFIRMAR`.** Só o número "+2.500 alunos"
   veio do cliente. Tudo o mais é rascunho, e o que afirma algo verificável está
   marcado: qual oferta destacar, a descrição do público, a fala assinada pelo
   Gabriel (escrita para ele, não dita por ele), e o formato dos cinco produtos
   — os rótulos CURSO/MATERIAL, os prefixos "Curso de " e as descrições foram
   inferidos só a partir dos nomes.

   O selo do primeiro card diz "Comece por aqui", não "Mais vendido": um
   ranking de vendas é afirmação verificável, e o cliente não passou esse dado.
3. Trocar o ano do rodapé quando virar o ano.

## Limitação conhecida: a fonte arredondada

O briefing pede tipografia arredondada e o projeto não pode fazer requisição de
rede, então a pilha usa só fontes de sistema. Na prática o resultado arredondado
aparece em Apple (`ui-rounded` / SF Pro Rounded) e em quem já tem Varela Round,
Nunito ou Quicksand instaladas. **No Android e no Windows sem Office a página cai
em Roboto/Segoe — legível e bem espaçada, mas não arredondada.**

Para resolver sem depender de CDN, coloque um arquivo local e adicione no topo
do `styles.css`:

```css
@font-face{
  font-family:"GJ Rounded";
  src:url("assets/gj-rounded.woff2") format("woff2");
  font-weight:400 700;          /* variável; se for estático, um @font-face por peso */
  font-display:swap;
  unicode-range:U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+2000-206F, U+2122;
}
```

e prefixe a família em `--font-display`. Baloo 2, Nunito e Quicksand (SIL OFL)
servem; subsetar para latino + acentos do português deixa o arquivo em ~20 KB.

## Verificações feitas

Medidas em Chromium, contra os arquivos como estão:

- Sem estouro horizontal e sem texto cortado em 11 larguras (320 → 2560), cada
  uma sob quatro condições: padrão, fonte-base 24px, fonte-base 32px (zoom de
  texto 200%) e o espaçamento do WCAG 1.4.12. 44 casos, todos limpos.
- Os 33 pares de contraste (texto e não-texto) calculados e aprovados em AA.
- Modo de cores forçadas do Windows: a palavra grifada do rodapé se mantém
  legível (14,60:1).
- Impressão: os seis grifos saem desenhados mesmo sem rolagem.
- Sem JS, e com movimento reduzido: a página renderiza completa.
- Os 13 pontos de tabulação são alcançáveis e todos têm anel de foco; o link
  "pular para o conteúdo" aparece e move o foco de verdade.
