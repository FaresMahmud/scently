const ct = require('../data/contratipos.json');
const corrupted = ct.filter(p =>
  p.inspiradoEm && /[�\?]/.test(p.inspiradoEm)
);
console.log('Corrupted inspiradoEm:', corrupted.length);
console.log(JSON.stringify(corrupted.map(p => ({
  id: p.id,
  nome: p.nome,
  inspiradoEm: p.inspiradoEm,
  marcaOriginal: p.marcaOriginal
})), null, 2));
