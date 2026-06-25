const ex = require('../data/perfumes-expandido.json');
const ct = require('../data/contratipos.json');

function scan(data, label) {
  // Look for ? that replaced accented chars (B?rbaro, Com?te, Sib?ria)
  const corrupted = data.filter(p => p.nome && /[A-Za-z]\?[A-Za-z]/.test(p.nome));
  // Also catch standalone ? not in URLs
  const withQ = data.filter(p => p.nome && p.nome.includes('?') && !corrupted.includes(p));
  console.log(label + ' — mid-word ?: ' + corrupted.length + ', other ?: ' + withQ.length);
  if (corrupted.length > 0) {
    console.log(JSON.stringify(corrupted.map(p => ({id: p.id, nome: p.nome, marca: p.marca})), null, 2));
  }
}

scan(ex, 'perfumes-expandido');
scan(ct, 'contratipos');
