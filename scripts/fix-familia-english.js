const fs = require('fs');
const path = require('path');

const CT_PATH = path.join(__dirname, '../data/contratipos.json');
const EX_PATH = path.join(__dirname, '../data/perfumes-expandido.json');

const ct = JSON.parse(fs.readFileSync(CT_PATH, 'utf-8'));
const ex = JSON.parse(fs.readFileSync(EX_PATH, 'utf-8'));

// Known Portuguese familia vocabulary (all lowercase for matching)
const PT_WORDS = new Set([
  'amadeirado','amadeirada','floral','oriental','cítrico','cítrica','aquático','aquática',
  'gourmand','frutal','almiscarado','almiscarada','especiado','especiada',
  'verde','chipre','fougère','fougere','fougére','fougére','aromático','aromática',
  'couro','tabaco','frutado','frutada','ambarino','ambarinada','baunilha',
  'gustativo','atalcado','atalcada','fresco','fresca',
  // compound connectors
  'e', 'de',
]);

// English → Portuguese normalisations
const FIX_MAP = {
  'musk':    'Almiscarado',
  'woody':   'Amadeirado',
  'fresh':   'Fresco',
  'spicy':   'Especiado',
  'floral':  'Floral',   // already PT but keep for safety
  'fruity':  'Frutal',
  'citrus':  'Cítrico',
  'leather': 'Couro',
  'tobacco': 'Tabaco',
  'amber':   'Ambarino',
  'musky':   'Almiscarado',
  'aromatic':'Aromático',
};

const suspicious = [];

function checkAndFix(p) {
  if (!p.familia || p.familia === 'Indefinida' || p.disponivel === false) return false;
  const words = p.familia.split(/[\s,]+/).filter(Boolean);
  let changed = false;
  const fixedWords = words.map(w => {
    const lower = w.toLowerCase();
    if (FIX_MAP[lower]) {
      suspicious.push({ id: p.id, original: p.familia, word: w, fix: FIX_MAP[lower] });
      changed = true;
      return FIX_MAP[lower];
    }
    // Flag unknown non-PT words (not in PT_WORDS and ASCII-only — accented words are PT)
    if (!/[àáâãäèéêëìíîïòóôõöùúûüýçñ]/i.test(w) && !PT_WORDS.has(lower) && /^[A-Za-z]/.test(w)) {
      suspicious.push({ id: p.id, original: p.familia, word: w, fix: '(unknown — flagged only)' });
    }
    return w;
  });
  if (changed) {
    // Deduplicate words after replacement, preserve order
    const seen = new Set();
    const deduped = fixedWords.filter(w => {
      const k = w.toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    p.familia = deduped.join(' ');
  }
  return changed;
}

let ctFixed = 0, exFixed = 0;
ct.forEach(p => { if (checkAndFix(p)) ctFixed++; });
const flaggedBeforeEx = suspicious.length;
ex.forEach(p => { if (checkAndFix(p)) exFixed++; });

console.log('Suspicious / fixed entries:');
console.log(JSON.stringify(suspicious, null, 2));
console.log(`\nContratipos fixed: ${ctFixed}`);
console.log(`Expandido fixed:   ${exFixed}`);

if (ctFixed + exFixed > 0) {
  fs.writeFileSync(CT_PATH, JSON.stringify(ct, null, 2), 'utf-8');
  fs.writeFileSync(EX_PATH, JSON.stringify(ex, null, 2), 'utf-8');
  console.log('\n✅ Files updated.');
} else {
  console.log('\nNo fixes needed.');
}
