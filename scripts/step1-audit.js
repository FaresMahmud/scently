const ct = require('../data/contratipos.json');
const ex = require('../data/perfumes-expandido.json');

const needsEnrichment = (p) => {
  if (p.disponivel === false) return false;
  const semNotas = !p.notas || p.notas.length === 0;
  const semFamilia = !p.familia || p.familia === 'Indefinida' || p.familia === '';
  return semNotas || semFamilia;
};

const ctNeeds = ct.filter(needsEnrichment);
const exNeeds = ex.filter(needsEnrichment);

console.log('Contratipos needing enrichment:', ctNeeds.length);
console.log('Expandido needing enrichment:', exNeeds.length);
console.log('Total:', ctNeeds.length + exNeeds.length);

// Breakdown: sem notas only, sem familia only, or both
const semNotasOnly = (p) => {
  const semNotas = !p.notas || p.notas.length === 0;
  const temFamilia = p.familia && p.familia !== 'Indefinida' && p.familia !== '';
  return semNotas && temFamilia;
};
const semFamiliaOnly = (p) => {
  const temNotas = p.notas && p.notas.length > 0;
  const semFamilia = !p.familia || p.familia === 'Indefinida' || p.familia === '';
  return temNotas && semFamilia;
};
const semAmbos = (p) => needsEnrichment(p) && !semNotasOnly(p) && !semFamiliaOnly(p);

const all = [...ctNeeds, ...exNeeds];
console.log('\nBreakdown:');
console.log('  Sem notas only:', all.filter(semNotasOnly).length);
console.log('  Sem familia only:', all.filter(semFamiliaOnly).length);
console.log('  Sem ambos:', all.filter(semAmbos).length);

console.log('\nSample contratipos:');
console.log(JSON.stringify(ctNeeds.slice(0,3).map(p => ({id: p.id, nome: p.nome, marca: p.marca, inspiradoEm: p.inspiradoEm, familia: p.familia, notas: p.notas})), null, 2));
console.log('\nSample expandido:');
console.log(JSON.stringify(exNeeds.slice(0,3).map(p => ({id: p.id, nome: p.nome, marca: p.marca, categoria: p.categoria, familia: p.familia, notas: p.notas})), null, 2));

const byBrand = {};
all.forEach(p => {
  const m = p.marca ?? 'unknown';
  byBrand[m] = (byBrand[m] || 0) + 1;
});
console.log('\nBy brand (top 15):');
console.log(JSON.stringify(Object.entries(byBrand).sort((a,b) => b[1]-a[1]).slice(0,15), null, 2));
