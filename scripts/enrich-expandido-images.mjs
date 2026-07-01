import fs from 'fs';

function normalizeId(str) {
  if (!str) return "";
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function cleanNameForMatch(str) {
  if (!str) return "";
  return normalizeId(str)
    .replace(/edp/g, "")
    .replace(/edt/g, "")
    .replace(/edc/g, "")
    .replace(/extrait/g, "")
    .replace(/parfum/g, "")
    .replace(/cologne/g, "")
    .replace(/intense/g, "")
    .replace(/elixir/g, "")
    .replace(/extreme/g, "")
    .replace(/pourhomme/g, "")
    .replace(/pourfemme/g, "")
    .trim();
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
    const qRaw = normalizeId(p.inspiradoEm);
    const qClean = cleanNameForMatch(p.inspiradoEm);
    const m = normalizeId(p.marcaOriginal || "");

    // Pass 1: exact/start match
    matched = fragella.find(f => {
      const fn = normalizeId(f.nome);
      const fm = normalizeId(f.marca);
      const brandOk = fm === m || fm.includes(m) || m.includes(fm);
      if (!brandOk) return false;
      return fn === qRaw || fn.startsWith(qRaw) || qRaw.startsWith(fn);
    });

    // Pass 2: prefix/substring match on clean name
    if (!matched) {
      matched = fragella.find(f => {
        const fn = cleanNameForMatch(f.nome);
        const fm = normalizeId(f.marca);
        const brandOk = fm === m || fm.includes(m) || m.includes(fm);
        if (!brandOk) return false;
        return fn.includes(qClean) || qClean.includes(fn);
      });
    }
  } else {
    // 2. Outras categorias: busca por nome + marca direta
    const qRaw = normalizeId(p.nome);
    const qClean = cleanNameForMatch(p.nome);
    const m = normalizeId(p.marca);

    // Pass 1: exact name + brand match
    matched = fragella.find(f => {
      const fn = normalizeId(f.nome);
      const fm = normalizeId(f.marca);
      const brandOk = fm === m || fm.includes(m) || m.includes(fm);
      if (!brandOk) return false;
      return fn === qRaw || fn.startsWith(qRaw) || qRaw.startsWith(fn);
    });

    // Pass 2: clean name substring match with brand
    if (!matched) {
      matched = fragella.find(f => {
        const fn = cleanNameForMatch(f.nome);
        const fm = normalizeId(f.marca);
        const brandOk = fm === m || fm.includes(m) || m.includes(fm);
        if (!brandOk) return false;
        return fn.includes(qClean) || qClean.includes(fn);
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
