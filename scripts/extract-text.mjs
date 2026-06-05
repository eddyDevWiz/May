import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// Pages to extract, in order
const PAGES = [
  { file: 'home.html', title: 'Home', url: 'https://maygarcia.co/' },
  { file: 'about.html', title: 'About', url: 'https://maygarcia.co/about/' },
  { file: 'contact.html', title: 'Contact', url: 'https://maygarcia.co/contact/' },
];

// Skip product/shop noise — those products are old and won't be reused
const SKIP = /Agotado|Sin existencias|\$\s*\d|Mostrando .*resultados|Luz de Navidad|Productos relacionados|Valoraciones|Información adicional/i;

const SRC = join(process.cwd(), '.wpdump');

function decodeEntities(s) {
  const named = {
    amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ',
    aacute: 'á', eacute: 'é', iacute: 'í', oacute: 'ó', uacute: 'ú',
    Aacute: 'Á', Eacute: 'É', Iacute: 'Í', Oacute: 'Ó', Uacute: 'Ú',
    ntilde: 'ñ', Ntilde: 'Ñ', uuml: 'ü', iquest: '¿', iexcl: '¡',
    hellip: '…', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘',
    ldquo: '“', rdquo: '”', deg: '°', euro: '€', copy: '©',
  };
  return s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => (n in named ? named[n] : m));
}

function clean(html) {
  // Remove non-content blocks entirely
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<svg[\s\S]*?<\/svg>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '');
}

function extract(html) {
  const body = clean(html);
  const out = [];
  const seen = new Set();
  // Match headings, paragraphs, list items, blockquotes, buttons
  const re = /<(h[1-6]|p|li|blockquote|button)\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let m;
  while ((m = re.exec(body)) !== null) {
    const tag = m[1].toLowerCase();
    let text = decodeEntities(m[2].replace(/<[^>]+>/g, ' '))
      .replace(/\s+/g, ' ')
      .trim();
    if (!text || text.length < 2) continue;
    if (SKIP.test(text)) continue;
    const key = tag.startsWith('h') ? text : tag + '|' + text;
    if (seen.has(key)) continue;
    seen.add(key);

    if (/^h[1-6]$/.test(tag)) {
      const level = Math.min(+tag[1] + 1, 6); // shift down one so page title stays #
      out.push('\n' + '#'.repeat(level) + ' ' + text);
    } else if (tag === 'li') {
      out.push('- ' + text);
    } else if (tag === 'blockquote') {
      out.push('> ' + text);
    } else if (tag === 'button') {
      out.push('`[' + text + ']`'); // render buttons as code-styled labels
    } else {
      out.push(text);
    }
  }
  return out.join('\n');
}

let md = '# Textos del sitio (maygarcia.co)\n\n';
md += '> Extraído automáticamente del WordPress actual. Úsalo como referencia para ir agregando el copy al sitio nuevo.\n';

for (const p of PAGES) {
  let html;
  try {
    html = readFileSync(join(SRC, p.file), 'utf8');
  } catch {
    continue;
  }
  md += `\n\n---\n\n# ${p.title}\n\n*${p.url}*\n\n`;
  md += extract(html) || '_(sin texto extraíble)_';
}

mkdirSync(join(process.cwd(), 'content'), { recursive: true });
const outPath = join(process.cwd(), 'content/textos-wordpress.md');
writeFileSync(outPath, md.trim() + '\n');
console.log('written:', outPath, `(${md.length} chars)`);
