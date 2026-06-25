const ct = require('../data/contratipos.json');
const ex = require('../data/perfumes-expandido.json');
const all = [...ct, ...ex];

const ids = [
  'azza-parfums-hannishe-inspiracao-olfativa-hacivat-nishane',
  'ja-essence-knight-perfume-inspirado-em-althai-r-parfums-de-marly-masculino',
  'thera-cosmeticos-perfume-masculino-bose',
  'paris-elysees-vodka-man',
  'ja-essence-cometa-perfume-inspirado-em-comete-lancome-feminino'
];

ids.forEach(id => {
  const p = all.find(x => x.id === id);
  if (!p) { console.log('NOT FOUND:', id); return; }
  console.log('---');
  console.log('id:', p.id);
  console.log('nome:', p.nome);
  console.log('marca:', p.marca);
  console.log('inspiradoEm:', p.inspiradoEm ?? '(none)');
  console.log('familia:', p.familia);
  console.log('notas:', p.notas);
});

console.log('--- RANDOM AZZA WITHOUT inspiradoEm ---');
const azzaSemInsp = all.filter(p =>
  p.marca === 'Azza Parfums' && !p.inspiradoEm && p.notas && p.notas.length > 0
);
const sample = azzaSemInsp[0];
if (sample) {
  console.log('id:', sample.id);
  console.log('nome:', sample.nome);
  console.log('marca:', sample.marca);
  console.log('familia:', sample.familia);
  console.log('notas:', sample.notas);
}
