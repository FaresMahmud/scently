import fs from 'fs';

function normalizeId(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

const EXPANDIDO_PATH = 'data/perfumes-expandido.json';
const FRAGELLA_PATH = 'data/catalogo-fragella.json';

const expandido = JSON.parse(fs.readFileSync(EXPANDIDO_PATH, 'utf8'));
const fragellaRaw = JSON.parse(fs.readFileSync(FRAGELLA_PATH, 'utf8'));
const fragella = fragellaRaw.perfumes;

console.log(`Carregados: ${expandido.length} perfumes no expandido, ${fragella.length} no Fragella.`);

let enriquecidos = 0;

for (const p of expandido) {
  let matched = null;

  if (p.categoria === 'contratipo' && p.inspiradoEm) {
    // 1. Contratipos: busca pela inspiração original
    const q = normalizeId(p.inspiradoEm);
    const m = normalizeId(p.marcaOriginal || "");

    // Pass 1: exact name + brand start match
    matched = fragella.find(f => {
      const fn = normalizeId(f.nome);
      const fm = normalizeId(f.marca);
      const brandOk = fm === m || fm.includes(m) || m.includes(fm);
      if (!brandOk) return false;
      return fn === q || fn.startsWith(q) || q.startsWith(fn);
    });

    // Pass 2: name-only exact or prefix match
    if (!matched) {
      matched = fragella.find(f => {
        const fn = normalizeId(f.nome);
        return fn === q || fn.startsWith(q + "-") || q.startsWith(fn + "-");
      });
    }

    // Pass 3: name substring with brand filter
    if (!matched) {
      matched = fragella.find(f => {
        const fn = normalizeId(f.nome);
        if (!fn.includes(q) && !q.includes(fn)) return false;
        if (m) {
          const fm = normalizeId(f.marca);
          return fm.includes(m) || m.includes(fm);
        }
        return true;
      });
    }
  } else {
    // 2. Outras categorias: busca por nome + marca direta
    const q = normalizeId(p.nome);
    const m = normalizeId(p.marca);

    // Pass 1: exact name + brand match
    matched = fragella.find(f => {
      const fn = normalizeId(f.nome);
      const fm = normalizeId(f.marca);
      const brandOk = fm === m || fm.includes(m) || m.includes(fm);
      if (!brandOk) return false;
      return fn === q || fn.startsWith(q) || q.startsWith(fn);
    });

    // Pass 2: name-only exact or prefix match + brand check
    if (!matched) {
      matched = fragella.find(f => {
        const fn = normalizeId(f.nome);
        const fm = normalizeId(f.marca);
        const brandOk = fm.includes(m) || m.includes(fm);
        if (!brandOk) return false;
        return fn === q || fn.startsWith(q + "-") || q.startsWith(fn + "-");
      });
    }
  }

  // Se encontrou no Fragella, copia as imagens
  if (matched) {
    let alterado = false;
    if (matched.imagemTransparente && p.imagemTransparente !== matched.imagemTransparente) {
      p.imagemTransparente = matched.imagemTransparente;
      alterado = true;
    }
    if (matched.imagem && p.imagem !== matched.imagem) {
      p.imagem = matched.imagem;
      alterado = true;
    }
    if (matched.imagemFallbacks?.length) {
      p.imagemFallbacks = matched.imagemFallbacks;
      alterado = true;
    }
    if (alterado) {
      enriquecidos++;
    }
  }
}

fs.writeFileSync(EXPANDIDO_PATH, JSON.stringify(expandido, null, 2), 'utf8');
console.log(`Imagens enriquecidas com sucesso: ${enriquecidos} perfumes atualizados.`);
