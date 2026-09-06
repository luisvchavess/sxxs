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

1. **Trocar os links.** Todos os `href="#"` são provisórios — há um comentário
   no topo do `index.html` listando os quatro grupos (orçamento, aluno, os cinco
   cards, e as redes do rodapé).
2. **Confirmar o texto marcado com `CONFIRMAR`.** Só o número "+2.500 alunos"
   veio do cliente. As linhas de apoio ("100% online", "no seu ritmo", o prazo
   de resposta) e a fala assinada pelo Gabriel são rascunho: precisam ser
   confirmadas ou trocadas antes de ir ao ar.
3. Trocar o ano do rodapé quando virar o ano.
