// Minimal markdown-to-HTML renderer, hand-written to keep the dependency
// surface at zero (matches this repo's stated design choice — see README).
// Supports exactly what the three long-form pages (exam overview, framework,
// cheat sheet) use: headings (#/##/###), paragraphs, unordered lists (-),
// GFM-style pipe tables, inline code spans (`x`), and inline bold (**x**).
// It is not a general-purpose markdown parser and should not be treated as one.

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderInline(text: string): string {
  let out = escapeHtml(text);
  out = out.replace(/`([^`]+)`/g, (_m, code) => `<code>${code}</code>`);
  out = out.replace(/\*\*([^*]+)\*\*/g, (_m, bold) => `<strong>${bold}</strong>`);
  return out;
}

function renderTable(lines: string[]): string {
  // lines[0] = header row, lines[1] = alignment row, lines[2..] = body rows
  const splitRow = (line: string) =>
    line
      .trim()
      .replace(/^\|/, '')
      .replace(/\|$/, '')
      .split('|')
      .map((cell) => cell.trim());
  const header = splitRow(lines[0]);
  const aligns = splitRow(lines[1]).map((cell) => {
    const left = cell.startsWith(':');
    const right = cell.endsWith(':');
    if (left && right) return 'center';
    if (right) return 'right';
    if (left) return 'left';
    return '';
  });
  const body = lines.slice(2).map(splitRow);
  const th = header
    .map((cell, i) => `<th${aligns[i] ? ` style="text-align:${aligns[i]}"` : ''}>${renderInline(cell)}</th>`)
    .join('');
  const rows = body
    .map(
      (row) =>
        `<tr>${row
          .map((cell, i) => `<td${aligns[i] ? ` style="text-align:${aligns[i]}"` : ''}>${renderInline(cell)}</td>`)
          .join('')}</tr>`
    )
    .join('');
  return `<div class="table-wrap"><table><thead><tr>${th}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

export function renderMarkdown(source: string): string {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const html: string[] = [];
  let i = 0;
  let paragraph: string[] = [];
  let list: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      html.push(`<p>${renderInline(paragraph.join(' '))}</p>`);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      html.push(`<ul>${list.map((item) => `<li>${renderInline(item)}</li>`).join('')}</ul>`);
      list = [];
    }
  };

  while (i < lines.length) {
    const line = lines[i];
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    const listItem = /^-\s+(.*)$/.exec(line);
    const isTableRow = /^\|.*\|$/.test(line.trim());

    if (heading) {
      flushParagraph();
      flushList();
      const level = heading[1].length;
      html.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      i += 1;
      continue;
    }

    if (isTableRow && /^\|[\s:|-]+\|$/.test((lines[i + 1] || '').trim())) {
      flushParagraph();
      flushList();
      const tableLines: string[] = [line];
      i += 1;
      while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) {
        tableLines.push(lines[i]);
        i += 1;
      }
      html.push(renderTable(tableLines));
      continue;
    }

    if (listItem) {
      flushParagraph();
      list.push(listItem[1]);
      i += 1;
      continue;
    }

    if (line.trim() === '') {
      flushParagraph();
      flushList();
      i += 1;
      continue;
    }

    flushList();
    paragraph.push(line.trim());
    i += 1;
  }
  flushParagraph();
  flushList();
  return html.join('');
}
