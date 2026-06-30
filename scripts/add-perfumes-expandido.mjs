/**
 * add-perfumes-expandido.mjs
 * Adiciona ~175 perfumes prioritários ao perfumes-expandido.json
 * com checkpoint para retomada após interrupção.
 *
 * Uso: node scripts/add-perfumes-expandido.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const EXPANDIDO_PATH = join(__dirname, '../data/perfumes-expandido.json')
const CHECKPOINT_PATH = join(__dirname, 'enrichment-checkpoint.json')

function slug(str) {
  return str
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function makeId(nome, marca) {
  return `${slug(marca)}-${slug(nome)}`
}

// ─────────────────────────────────────────────────────────────────────────────
// DADOS DOS 175 PERFUMES PRIORITÁRIOS
// ─────────────────────────────────────────────────────────────────────────────

const NOVOS_PERFUMES = [

  // ── GIORGIO ARMANI ──────────────────────────────────────────────────────────
  { nome: "Acqua di Gio",                tipo: "EDT", genero: "Masculino", marca: "Giorgio Armani", familia: "Aromático Aquático",    notas: ["Bergamota", "Lima", "Neroli", "Jasmim", "Cedro", "Patchouli", "Almíscar"],                 preco_brl: 420, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Acqua di Gio Profumo",        tipo: "EDP", genero: "Masculino", marca: "Giorgio Armani", familia: "Aromático Aquático",    notas: ["Bergamota", "Incenso", "Algas marinhas", "Patchouli", "Âmbar cinza"],                      preco_brl: 580, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Acqua di Gio Profondo",       tipo: "EDP", genero: "Masculino", marca: "Giorgio Armani", familia: "Aquático Aromático",    notas: ["Bergamota", "Aquozone", "Cipreste", "Patchouli", "Almíscar"],                              preco_brl: 480, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Armani Code",                 tipo: "EDT", genero: "Masculino", marca: "Giorgio Armani", familia: "Oriental Amadeirado",   notas: ["Bergamota", "Limão", "Flor de laranjeira", "Baunilha", "Couro", "Guaiac wood"],             preco_brl: 420, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Armani Code Parfum",          tipo: "Parfum", genero: "Masculino", marca: "Giorgio Armani", familia: "Oriental Amadeirado", notas: ["Bergamota", "Lavanda", "Baunilha", "Madeira de tonka", "Couro"],                          preco_brl: 550, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Armani Code Absolu",          tipo: "EDP", genero: "Masculino", marca: "Giorgio Armani", familia: "Oriental Amadeirado",   notas: ["Mel", "Cardamomo", "Laranja", "Baunilha", "Patchouli"],                                    preco_brl: 480, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Stronger With You Intensely", tipo: "EDP", genero: "Masculino", marca: "Giorgio Armani", familia: "Oriental Especiado",    notas: ["Castanha", "Cardamomo", "Lavanda", "Baunilha", "Âmbar"],                                   preco_brl: 480, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Stronger With You Absolutely",tipo: "Parfum", genero: "Masculino", marca: "Giorgio Armani", familia: "Oriental Amadeirado", notas: ["Castanha", "Baunilha", "Sálvia", "Cedro", "Patchouli"],                                  preco_brl: 520, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Si",                          tipo: "EDP", genero: "Feminino",  marca: "Giorgio Armani", familia: "Floral Chypre",         notas: ["Groselha negra", "Rosa", "Frésia", "Baunilha", "Patchouli", "Almíscar"],                   preco_brl: 480, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Si Passione",                 tipo: "EDP", genero: "Feminino",  marca: "Giorgio Armani", familia: "Floral Oriental",       notas: ["Groselha negra", "Rosa", "Jasmim", "Âmbar", "Almíscar"],                                   preco_brl: 480, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "My Way",                      tipo: "EDP", genero: "Feminino",  marca: "Giorgio Armani", familia: "Floral Almíscaro",      notas: ["Bergamota", "Flor de laranjeira", "Magnólia", "Cedro", "Almíscar"],                        preco_brl: 520, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "My Way Intense",              tipo: "EDP", genero: "Feminino",  marca: "Giorgio Armani", familia: "Floral Oriental",       notas: ["Bergamota", "Tuberose", "Baunilha", "Âmbar"],                                              preco_brl: 520, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Acqua di Gioia",             tipo: "EDP", genero: "Feminino",  marca: "Giorgio Armani", familia: "Floral Aquático",       notas: ["Menta", "Lima", "Jasmim", "Rosa", "Cedro", "Almíscar"],                                    preco_brl: 420, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },

  // ── PACO RABANNE ─────────────────────────────────────────────────────────────
  { nome: "1 Million",                   tipo: "EDT", genero: "Masculino", marca: "Paco Rabanne", familia: "Oriental Especiado",      notas: ["Toranja", "Canela", "Rosa", "Patchouli", "Couro", "Âmbar"],                                preco_brl: 380, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "1 Million Parfum",            tipo: "Parfum", genero: "Masculino", marca: "Paco Rabanne", familia: "Oriental Especiado",   notas: ["Cardamomo", "Canela", "Rum", "Patchouli", "Couro"],                                        preco_brl: 450, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "1 Million Lucky",             tipo: "EDT", genero: "Masculino", marca: "Paco Rabanne", familia: "Aromático Fougère",       notas: ["Toranja", "Feno", "Patchouli", "Âmbar"],                                                   preco_brl: 380, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "1 Million Elixir",            tipo: "EDP", genero: "Masculino", marca: "Paco Rabanne", familia: "Oriental Amadeirado",     notas: ["Cardamomo", "Couro", "Patchouli", "Baunilha"],                                             preco_brl: 450, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Invictus",                    tipo: "EDT", genero: "Masculino", marca: "Paco Rabanne", familia: "Aromático Aquático",      notas: ["Toranja", "Neroli", "Pimenta rosa", "Guaiac wood", "Almíscar"],                            preco_brl: 380, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Invictus Legend",             tipo: "EDP", genero: "Masculino", marca: "Paco Rabanne", familia: "Oriental Amadeirado",     notas: ["Bergamota", "Cardamomo", "Sândalo", "Âmbar"],                                              preco_brl: 420, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Invictus Victory",            tipo: "EDP", genero: "Masculino", marca: "Paco Rabanne", familia: "Aromático Amadeirado",    notas: ["Laranja vermelha", "Amêndoa", "Âmbar", "Almíscar"],                                        preco_brl: 420, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Phantom",                     tipo: "EDT", genero: "Masculino", marca: "Paco Rabanne", familia: "Aromático Amadeirado",    notas: ["Lavanda", "Limão", "Baunilha", "Madeira", "Almíscar"],                                     preco_brl: 380, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Olympéa",                     tipo: "EDP", genero: "Feminino",  marca: "Paco Rabanne", familia: "Floral Oriental",         notas: ["Pimenta rosa", "Flor de chá", "Baunilha salgada", "Almíscar"],                             preco_brl: 380, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Olympéa Intense",             tipo: "EDP", genero: "Feminino",  marca: "Paco Rabanne", familia: "Oriental Amadeirado",     notas: ["Sândalo", "Baunilha", "Pimenta rosa", "Almíscar"],                                         preco_brl: 420, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Lady Million",                tipo: "EDP", genero: "Feminino",  marca: "Paco Rabanne", familia: "Floral Chypre",           notas: ["Toranja", "Framboesa", "Neroli", "Gardênia", "Mel", "Patchouli"],                          preco_brl: 420, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Fame",                        tipo: "EDP", genero: "Feminino",  marca: "Paco Rabanne", familia: "Floral Amadeirado",       notas: ["Ylang-ylang", "Jasmim", "Vetiver", "Cenoura", "Sálvia"],                                   preco_brl: 420, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },

  // ── CAROLINA HERRERA ─────────────────────────────────────────────────────────
  { nome: "212 VIP Men",                 tipo: "EDT", genero: "Masculino", marca: "Carolina Herrera", familia: "Aromático Oriental",  notas: ["Cardamomo", "Gálbano", "Couro", "Âmbar", "Almíscar"],                                      preco_brl: 380, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "212 VIP Black",               tipo: "EDP", genero: "Masculino", marca: "Carolina Herrera", familia: "Oriental Especiado",  notas: ["Cardamomo", "Especiarias", "Couro", "Patchouli", "Âmbar"],                                 preco_brl: 400, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "212 Men",                     tipo: "EDT", genero: "Masculino", marca: "Carolina Herrera", familia: "Aromático Amadeirado", notas: ["Bergamota", "Sálvia", "Cedro", "Sândalo", "Almíscar"],                                    preco_brl: 350, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "212 VIP Rosé",                tipo: "EDP", genero: "Feminino",  marca: "Carolina Herrera", familia: "Floral Frutal",        notas: ["Toranja", "Framboesa", "Frésia", "Baunilha", "Almíscar"],                                 preco_brl: 380, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "212 VIP",                     tipo: "EDP", genero: "Feminino",  marca: "Carolina Herrera", familia: "Floral Oriental",      notas: ["Rosa", "Peônia", "Baunilha", "Âmbar", "Almíscar"],                                        preco_brl: 380, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Good Girl",                   tipo: "EDP", genero: "Feminino",  marca: "Carolina Herrera", familia: "Floral Oriental",      notas: ["Café", "Tuberose", "Cacau", "Baunilha", "Patchouli"],                                     preco_brl: 420, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Good Girl Supreme",           tipo: "EDP", genero: "Feminino",  marca: "Carolina Herrera", familia: "Floral Oriental",      notas: ["Café", "Framboesa", "Rosa", "Âmbar", "Almíscar"],                                         preco_brl: 440, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Very Good Girl",              tipo: "EDP", genero: "Feminino",  marca: "Carolina Herrera", familia: "Floral Frutal",        notas: ["Framboesa", "Rosa", "Frésia", "Almíscar"],                                                 preco_brl: 420, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Bad Boy",                     tipo: "EDT", genero: "Masculino", marca: "Carolina Herrera", familia: "Aromático Amadeirado", notas: ["Aldeídos", "Limão", "Elemi", "Patchouli", "Couro", "Âmbar"],                              preco_brl: 380, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Bad Boy Le Parfum",           tipo: "EDP", genero: "Masculino", marca: "Carolina Herrera", familia: "Oriental Amadeirado",  notas: ["Cardamomo", "Artemísia", "Couro", "Âmbar"],                                               preco_brl: 420, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "CH Men",                      tipo: "EDT", genero: "Masculino", marca: "Carolina Herrera", familia: "Aromático Amadeirado", notas: ["Bergamota", "Cardamomo", "Caramelo", "Cedro"],                                             preco_brl: 350, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "CH",                          tipo: "EDP", genero: "Feminino",  marca: "Carolina Herrera", familia: "Floral Oriental",      notas: ["Tuberose", "Violeta", "Âmbar", "Almíscar"],                                               preco_brl: 380, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },

  // ── YVES SAINT LAURENT ───────────────────────────────────────────────────────
  { nome: "La Nuit de L'Homme",          tipo: "EDT", genero: "Masculino", marca: "Yves Saint Laurent", familia: "Oriental Amadeirado", notas: ["Cardamomo", "Lavanda", "Couro", "Cedro", "Vetiver"],                                     preco_brl: 450, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "La Nuit de L'Homme Le Parfum",tipo: "EDP", genero: "Masculino", marca: "Yves Saint Laurent", familia: "Oriental Amadeirado", notas: ["Cardamomo", "Bergamota", "Couro", "Cedro", "Âmbar"],                                    preco_brl: 520, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Y",                           tipo: "EDP", genero: "Masculino", marca: "Yves Saint Laurent", familia: "Aromático Amadeirado", notas: ["Bergamota", "Sálvia", "Feno", "Cedro", "Âmbar", "Almíscar"],                            preco_brl: 480, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Y Le Parfum",                 tipo: "Parfum", genero: "Masculino", marca: "Yves Saint Laurent", familia: "Aromático Amadeirado", notas: ["Bergamota", "Sálvia", "Cedro", "Âmbar", "Couro"],                                   preco_brl: 520, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "L'Homme",                     tipo: "EDT", genero: "Masculino", marca: "Yves Saint Laurent", familia: "Aromático Fougère",   notas: ["Bergamota", "Gengibre", "Sálvia", "Cedro", "Vetiver"],                                   preco_brl: 420, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Black Opium",                 tipo: "EDP", genero: "Feminino",  marca: "Yves Saint Laurent", familia: "Oriental Gourmand",   notas: ["Café", "Baunilha", "Flor de laranjeira", "Patchouli", "Almíscar"],                       preco_brl: 450, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Black Opium Intense",         tipo: "EDP", genero: "Feminino",  marca: "Yves Saint Laurent", familia: "Oriental Gourmand",   notas: ["Café", "Canela", "Baunilha", "Âmbar"],                                                  preco_brl: 500, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Libre",                       tipo: "EDP", genero: "Feminino",  marca: "Yves Saint Laurent", familia: "Floral Aromático",    notas: ["Lavanda", "Flor de laranjeira", "Jasmim", "Âmbar", "Almíscar"],                          preco_brl: 480, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Libre Intense",               tipo: "EDP", genero: "Feminino",  marca: "Yves Saint Laurent", familia: "Oriental Aromático",  notas: ["Lavanda", "Baunilha", "Âmbar", "Almíscar"],                                              preco_brl: 520, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Mon Paris",                   tipo: "EDP", genero: "Feminino",  marca: "Yves Saint Laurent", familia: "Floral Frutal",       notas: ["Morango", "Peônia", "Rosa", "Patchouli", "Almíscar"],                                    preco_brl: 450, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },

  // ── VERSACE ───────────────────────────────────────────────────────────────────
  { nome: "Eros",                        tipo: "EDT", genero: "Masculino", marca: "Versace", familia: "Aromático Frutal",             notas: ["Menta", "Maçã verde", "Fava de tonka", "Âmbar", "Almíscar"],                               preco_brl: 380, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Eros Flame",                  tipo: "EDP", genero: "Masculino", marca: "Versace", familia: "Aromático Amadeirado",        notas: ["Toranja", "Pimenta rosa", "Rosewood", "Âmbar"],                                             preco_brl: 400, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Versace Pour Homme",          tipo: "EDT", genero: "Masculino", marca: "Versace", familia: "Aromático Mediterrâneo",      notas: ["Limão", "Bergamota", "Neroli", "Cedro", "Âmbar"],                                           preco_brl: 350, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Dylan Blue",                  tipo: "EDT", genero: "Masculino", marca: "Versace", familia: "Aromático Aquático",          notas: ["Toranja", "Figo", "Coentro", "Ambroxan", "Almíscar"],                                       preco_brl: 380, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Bright Crystal",              tipo: "EDT", genero: "Feminino",  marca: "Versace", familia: "Floral Frutal",               notas: ["Toranja", "Magnólia", "Peônia", "Âmbar", "Almíscar"],                                       preco_brl: 350, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Crystal Noir",                tipo: "EDP", genero: "Feminino",  marca: "Versace", familia: "Floral Oriental",             notas: ["Pimenta", "Gengibre", "Nardostachys", "Gardênia", "Âmbar"],                                 preco_brl: 380, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Yellow Diamond",              tipo: "EDT", genero: "Feminino",  marca: "Versace", familia: "Floral Frutal",               notas: ["Bergamota", "Pêra", "Frésia", "Rosa", "Almíscar"],                                          preco_brl: 350, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Eros Pour Femme",             tipo: "EDP", genero: "Feminino",  marca: "Versace", familia: "Floral Frutal",               notas: ["Pomelo", "Limão", "Jasmim", "Peônia", "Almíscar"],                                          preco_brl: 380, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },

  // ── DOLCE & GABBANA ──────────────────────────────────────────────────────────
  { nome: "The One",                     tipo: "EDP", genero: "Masculino", marca: "Dolce & Gabbana", familia: "Oriental Amadeirado",  notas: ["Bergamota", "Toranja", "Gengibre", "Cardamomo", "Sândalo", "Âmbar"],                       preco_brl: 450, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "The One",                     tipo: "EDT", genero: "Masculino", marca: "Dolce & Gabbana", familia: "Aromático Oriental",   notas: ["Bergamota", "Toranja", "Gengibre", "Cardamomo", "Âmbar"],                                  preco_brl: 400, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Light Blue",                  tipo: "EDT", genero: "Masculino", marca: "Dolce & Gabbana", familia: "Aromático Aquático",   notas: ["Cedro siciliano", "Toranja", "Pimenta", "Âmbar", "Almíscar"],                              preco_brl: 380, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Light Blue",                  tipo: "EDT", genero: "Feminino",  marca: "Dolce & Gabbana", familia: "Floral Frutal",        notas: ["Bergamota", "Maçã", "Bamboo", "Jasmim", "Cedro", "Almíscar"],                              preco_brl: 380, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "K",                           tipo: "EDP", genero: "Masculino", marca: "Dolce & Gabbana", familia: "Oriental Amadeirado",  notas: ["Cardamomo", "Neroli", "Clávia", "Âmbar", "Couro"],                                         preco_brl: 420, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "K",                           tipo: "EDT", genero: "Masculino", marca: "Dolce & Gabbana", familia: "Aromático Amadeirado", notas: ["Cardamomo", "Lavanda", "Cedro", "Âmbar"],                                                  preco_brl: 380, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "The Only One",                tipo: "EDP", genero: "Feminino",  marca: "Dolce & Gabbana", familia: "Floral Oriental",      notas: ["Bergamota", "Violeta", "Íris", "Flor de laranjeira", "Baunilha"],                           preco_brl: 420, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Dolce",                       tipo: "EDP", genero: "Feminino",  marca: "Dolce & Gabbana", familia: "Floral Branco",        notas: ["Neroli", "Papiro", "Amarílis", "Cashmere wood", "Almíscar"],                               preco_brl: 420, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },

  // ── HUGO BOSS ────────────────────────────────────────────────────────────────
  { nome: "Boss Bottled",                tipo: "EDP", genero: "Masculino", marca: "Hugo Boss", familia: "Oriental Amadeirado",        notas: ["Maçã", "Canela", "Noz-moscada", "Sândalo", "Vetiver"],                                     preco_brl: 380, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Boss Bottled",                tipo: "EDT", genero: "Masculino", marca: "Hugo Boss", familia: "Aromático Amadeirado",       notas: ["Maçã", "Canela", "Sândalo", "Cedro", "Vetiver"],                                           preco_brl: 350, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Boss Bottled Infinite",       tipo: "EDP", genero: "Masculino", marca: "Hugo Boss", familia: "Aromático Amadeirado",       notas: ["Bergamota", "Cardamomo", "Sândalo", "Vetiver"],                                             preco_brl: 380, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Boss The Scent",              tipo: "EDT", genero: "Masculino", marca: "Hugo Boss", familia: "Aromático Oriental",         notas: ["Gengibre", "Manihot", "Sândalo", "Âmbar"],                                                 preco_brl: 350, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Boss The Scent Le Parfum",    tipo: "EDP", genero: "Masculino", marca: "Hugo Boss", familia: "Oriental Amadeirado",        notas: ["Gengibre", "Couro", "Âmbar", "Baunilha"],                                                  preco_brl: 420, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Boss Femme",                  tipo: "EDP", genero: "Feminino",  marca: "Hugo Boss", familia: "Floral Almíscaro",           notas: ["Rosa", "Frésia", "Almíscar", "Sândalo"],                                                   preco_brl: 350, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Boss The Scent For Her",      tipo: "EDT", genero: "Feminino",  marca: "Hugo Boss", familia: "Floral Oriental",            notas: ["Chá preto", "Pêssego", "Flor de hibisco", "Âmbar"],                                        preco_brl: 350, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },

  // ── JEAN PAUL GAULTIER ───────────────────────────────────────────────────────
  { nome: "Le Male",                     tipo: "EDT", genero: "Masculino", marca: "Jean Paul Gaultier", familia: "Aromático Oriental", notas: ["Lavanda", "Menta", "Baunilha", "Âmbar", "Cedro"],                                         preco_brl: 400, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Le Male Le Parfum",           tipo: "EDP", genero: "Masculino", marca: "Jean Paul Gaultier", familia: "Oriental Aromático", notas: ["Lavanda", "Baunilha", "Âmbar", "Couro", "Almíscar"],                                      preco_brl: 480, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Ultra Male",                  tipo: "EDT", genero: "Masculino", marca: "Jean Paul Gaultier", familia: "Oriental Gourmand",  notas: ["Lavanda", "Pêra", "Canela", "Baunilha", "Âmbar"],                                         preco_brl: 420, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Scandal Pour Homme",          tipo: "EDT", genero: "Masculino", marca: "Jean Paul Gaultier", familia: "Aromático Amadeirado", notas: ["Bergamota", "Toranja", "Patchouli", "Vetiver"],                                         preco_brl: 420, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Scandal Pour Homme Le Parfum",tipo: "EDP", genero: "Masculino", marca: "Jean Paul Gaultier", familia: "Oriental Amadeirado", notas: ["Patchouli", "Couro", "Âmbar", "Almíscar"],                                               preco_brl: 480, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Scandal",                     tipo: "EDP", genero: "Feminino",  marca: "Jean Paul Gaultier", familia: "Floral Oriental",    notas: ["Mel", "Gardênia", "Patchouli", "Couro"],                                                  preco_brl: 420, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Classique",                   tipo: "EDT", genero: "Feminino",  marca: "Jean Paul Gaultier", familia: "Floral Oriental",    notas: ["Flor de laranjeira", "Rosa", "Baunilha", "Âmbar"],                                        preco_brl: 380, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },

  // ── LANCÔME ───────────────────────────────────────────────────────────────────
  { nome: "La Vie Est Belle",            tipo: "EDP", genero: "Feminino",  marca: "Lancôme", familia: "Floral Gourmand",              notas: ["Íris", "Pralinê", "Baunilha", "Patchouli", "Almíscar"],                                    preco_brl: 500, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "La Vie Est Belle Intensément",tipo: "EDP", genero: "Feminino",  marca: "Lancôme", familia: "Floral Gourmand",              notas: ["Framboesa", "Íris", "Baunilha", "Pralinê"],                                                preco_brl: 550, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Idôle",                       tipo: "EDP", genero: "Feminino",  marca: "Lancôme", familia: "Floral Almíscaro",             notas: ["Bergamota", "Rosa", "Jasmim", "Almíscar"],                                                 preco_brl: 480, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Idôle Intense",               tipo: "EDP", genero: "Feminino",  marca: "Lancôme", familia: "Floral Oriental",              notas: ["Rosa", "Jasmim", "Baunilha", "Âmbar"],                                                     preco_brl: 520, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Trésor",                      tipo: "EDP", genero: "Feminino",  marca: "Lancôme", familia: "Floral Oriental",              notas: ["Íris", "Rosa", "Lilás", "Âmbar", "Almíscar"],                                              preco_brl: 450, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "La Nuit Trésor",              tipo: "EDP", genero: "Feminino",  marca: "Lancôme", familia: "Floral Gourmand",              notas: ["Rosa", "Framboesa", "Baunilha", "Patchouli"],                                              preco_brl: 480, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },

  // ── TOM FORD ─────────────────────────────────────────────────────────────────
  { nome: "Black Orchid",                tipo: "EDP", genero: "Unissex",   marca: "Tom Ford", familia: "Floral Oriental",             notas: ["Orquídea preta", "Rum", "Trufa", "Baunilha", "Patchouli"],                                 preco_brl: 850, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },
  { nome: "Tobacco Vanille",             tipo: "EDP", genero: "Unissex",   marca: "Tom Ford", familia: "Oriental Aromático",          notas: ["Tabaco", "Baunilha", "Cacau", "Bálsamo do Peru"],                                          preco_brl: 1200, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },
  { nome: "Oud Wood",                    tipo: "EDP", genero: "Unissex",   marca: "Tom Ford", familia: "Amadeirado Oriental",         notas: ["Oud", "Sândalo", "Vetiver", "Cardamomo", "Âmbar"],                                         preco_brl: 1200, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },
  { nome: "Lost Cherry",                 tipo: "EDP", genero: "Unissex",   marca: "Tom Ford", familia: "Floral Gourmand",             notas: ["Cereja", "Amêndoa", "Rum", "Almíscar", "Baunilha"],                                        preco_brl: 1100, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },
  { nome: "Bitter Peach",                tipo: "EDP", genero: "Unissex",   marca: "Tom Ford", familia: "Oriental Frutal",             notas: ["Pêssego", "Cardamomo", "Âmbar", "Almíscar"],                                               preco_brl: 950, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },
  { nome: "Neroli Portofino",            tipo: "EDP", genero: "Unissex",   marca: "Tom Ford", familia: "Aromático Cítrico",           notas: ["Neroli", "Âmbar cinza", "Bergamota", "Almíscar"],                                          preco_brl: 950, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },
  { nome: "Fucking Fabulous",            tipo: "EDP", genero: "Unissex",   marca: "Tom Ford", familia: "Oriental Amadeirado",         notas: ["Couro", "Âmbar", "Baunilha", "Almíscar"],                                                  preco_brl: 1000, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },
  { nome: "Tuscan Leather",              tipo: "EDP", genero: "Unissex",   marca: "Tom Ford", familia: "Couro Aromático",             notas: ["Rosa", "Açafrão", "Couro", "Almíscar"],                                                    preco_brl: 1100, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },

  // ── VIKTOR & ROLF ─────────────────────────────────────────────────────────────
  { nome: "Spicebomb Extreme",           tipo: "EDP", genero: "Masculino", marca: "Viktor & Rolf", familia: "Oriental Especiado",     notas: ["Pimenta", "Tabaco", "Âmbar", "Baunilha", "Labdanum"],                                      preco_brl: 580, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Spicebomb Night Vision",      tipo: "EDT", genero: "Masculino", marca: "Viktor & Rolf", familia: "Aromático Especiado",    notas: ["Bergamota", "Pimenta negra", "Vetiver", "Âmbar"],                                          preco_brl: 550, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Flowerbomb",                  tipo: "EDP", genero: "Feminino",  marca: "Viktor & Rolf", familia: "Floral",                 notas: ["Bergamota", "Jasmim", "Rosa", "Frésia", "Patchouli", "Almíscar"],                          preco_brl: 600, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Flowerbomb Nectar",           tipo: "EDP", genero: "Feminino",  marca: "Viktor & Rolf", familia: "Floral Oriental",        notas: ["Rosa", "Jasmim", "Âmbar", "Almíscar"],                                                     preco_brl: 650, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },

  // ── CREED ─────────────────────────────────────────────────────────────────────
  { nome: "Aventus",                     tipo: "EDP", genero: "Masculino", marca: "Creed", familia: "Amadeirado Frutal",              notas: ["Bergamota", "Maçã", "Abacaxi", "Bétula", "Almíscar", "Âmbar"],                             preco_brl: 1800, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },
  { nome: "Green Irish Tweed",           tipo: "EDT", genero: "Masculino", marca: "Creed", familia: "Aromático Amadeirado",           notas: ["Violeta", "Íris florentina", "Sândalo", "Vetiver"],                                        preco_brl: 1600, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },
  { nome: "Silver Mountain Water",       tipo: "EDP", genero: "Masculino", marca: "Creed", familia: "Aromático Aquático",             notas: ["Bergamota", "Chá verde", "Groselha", "Âmbar", "Almíscar"],                                 preco_brl: 1700, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },
  { nome: "Viking",                      tipo: "EDP", genero: "Masculino", marca: "Creed", familia: "Aromático Amadeirado",           notas: ["Bergamota", "Lavanda", "Pimenta rosa", "Cedro", "Almíscar"],                               preco_brl: 1800, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },
  { nome: "Love in White",               tipo: "EDP", genero: "Feminino",  marca: "Creed", familia: "Floral Amadeirado",             notas: ["Narciso", "Cedro", "Âmbar", "Almíscar"],                                                   preco_brl: 1600, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },

  // ── RALPH LAUREN ─────────────────────────────────────────────────────────────
  { nome: "Polo Blue",                   tipo: "EDP", genero: "Masculino", marca: "Ralph Lauren", familia: "Aromático Aquático",      notas: ["Melão", "Manjericão", "Cedro", "Almíscar"],                                                preco_brl: 380, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Polo Blue",                   tipo: "EDT", genero: "Masculino", marca: "Ralph Lauren", familia: "Aromático Aquático",      notas: ["Melão", "Sálvia", "Cedro", "Almíscar"],                                                    preco_brl: 350, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Polo Red",                    tipo: "EDP", genero: "Masculino", marca: "Ralph Lauren", familia: "Aromático Amadeirado",    notas: ["Toranja", "Sálvia", "Cedro", "Âmbar"],                                                     preco_brl: 380, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Ralph's Club",                tipo: "EDP", genero: "Masculino", marca: "Ralph Lauren", familia: "Aromático Oriental",      notas: ["Cardamomo", "Lavanda", "Âmbar", "Vetiver"],                                                preco_brl: 450, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Romance",                     tipo: "EDP", genero: "Feminino",  marca: "Ralph Lauren", familia: "Floral Almíscaro",        notas: ["Frésia", "Íris", "Almíscar", "Cedro"],                                                     preco_brl: 350, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },

  // ── AZZARO ───────────────────────────────────────────────────────────────────
  { nome: "Wanted",                      tipo: "EDT", genero: "Masculino", marca: "Azzaro", familia: "Aromático Amadeirado",          notas: ["Cardamomo", "Coentro", "Lavanda", "Cedro", "Vetiver"],                                     preco_brl: 320, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Wanted by Night",             tipo: "EDP", genero: "Masculino", marca: "Azzaro", familia: "Oriental Amadeirado",           notas: ["Cardamomo", "Rum", "Cedro", "Couro"],                                                      preco_brl: 380, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "The Most Wanted Parfum",      tipo: "Parfum", genero: "Masculino", marca: "Azzaro", familia: "Oriental Gourmand",          notas: ["Lavanda", "Cardamomo", "Pralinê", "Couro", "Baunilha"],                                    preco_brl: 420, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Chrome",                      tipo: "EDT", genero: "Masculino", marca: "Azzaro", familia: "Aromático Aquático",            notas: ["Bergamota", "Neroli", "Pimenta rosa", "Sândalo", "Almíscar"],                              preco_brl: 300, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Chrome Extreme",              tipo: "EDP", genero: "Masculino", marca: "Azzaro", familia: "Aromático Amadeirado",          notas: ["Bergamota", "Pimenta rosa", "Sândalo", "Âmbar"],                                           preco_brl: 350, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },

  // ── CALVIN KLEIN ─────────────────────────────────────────────────────────────
  { nome: "CK One",                      tipo: "EDT", genero: "Unissex",   marca: "Calvin Klein", familia: "Aromático Cítrico",       notas: ["Bergamota", "Chá verde", "Cardamomo", "Rosa", "Jasmim", "Almíscar"],                       preco_brl: 280, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "CK Be",                       tipo: "EDT", genero: "Unissex",   marca: "Calvin Klein", familia: "Aromático Floral",        notas: ["Bergamota", "Lavanda", "Sândalo", "Almíscar"],                                             preco_brl: 280, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Eternity",                    tipo: "EDT", genero: "Masculino", marca: "Calvin Klein", familia: "Aromático Floral",        notas: ["Bergamota", "Sálvia", "Jasmim", "Almíscar", "Sândalo"],                                    preco_brl: 320, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Eternity",                    tipo: "EDP", genero: "Feminino",  marca: "Calvin Klein", familia: "Floral Almíscaro",        notas: ["Rosa", "Jasmim", "Almíscar", "Sândalo"],                                                   preco_brl: 320, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Euphoria",                    tipo: "EDP", genero: "Feminino",  marca: "Calvin Klein", familia: "Floral Oriental",         notas: ["Romã", "Creme de leite", "Orquídea", "Mogno", "Patchouli"],                               preco_brl: 380, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Obsession",                   tipo: "EDT", genero: "Masculino", marca: "Calvin Klein", familia: "Oriental Amadeirado",     notas: ["Mandarina", "Bergamota", "Âmbar", "Sândalo", "Baunilha"],                                  preco_brl: 320, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },

  // ── MARC JACOBS ──────────────────────────────────────────────────────────────
  { nome: "Daisy",                       tipo: "EDT", genero: "Feminino",  marca: "Marc Jacobs", familia: "Floral Frutal",            notas: ["Morango", "Violeta", "Jasmim", "Almíscar", "Sândalo"],                                     preco_brl: 380, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Daisy Dream",                 tipo: "EDT", genero: "Feminino",  marca: "Marc Jacobs", familia: "Floral Frutal",            notas: ["Blackberry", "Toranja", "Frésia", "Âmbar", "Almíscar"],                                    preco_brl: 380, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Decadence",                   tipo: "EDP", genero: "Feminino",  marca: "Marc Jacobs", familia: "Floral Oriental",          notas: ["Íris", "Sálvia", "Peônia", "Vetiver", "Âmbar"],                                           preco_brl: 420, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Perfect",                     tipo: "EDP", genero: "Feminino",  marca: "Marc Jacobs", familia: "Floral Aromático",         notas: ["Ruibarbo", "Magnólia", "Cedro", "Almíscar"],                                               preco_brl: 420, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },

  // ── BURBERRY ─────────────────────────────────────────────────────────────────
  { nome: "Her",                         tipo: "EDP", genero: "Feminino",  marca: "Burberry", familia: "Floral Frutal",               notas: ["Frutas vermelhas", "Rosa", "Jasmim", "Âmbar", "Almíscar"],                                preco_brl: 420, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Touch",                       tipo: "EDT", genero: "Masculino", marca: "Burberry", familia: "Aromático Amadeirado",        notas: ["Bergamota", "Pimenta branca", "Cedro", "Âmbar"],                                           preco_brl: 380, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "London",                      tipo: "EDT", genero: "Masculino", marca: "Burberry", familia: "Aromático Amadeirado",        notas: ["Bergamota", "Alecrim", "Cedro", "Âmbar"],                                                  preco_brl: 380, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },
  { nome: "Mr. Burberry",                tipo: "EDP", genero: "Masculino", marca: "Burberry", familia: "Aromático Amadeirado",        notas: ["Água de manuka", "Vetiver", "Âmbar", "Cedro"],                                             preco_brl: 420, categoria: "importado-designer", inspiradoEm: null, marcaOriginal: null },

  // ── PARFUMS DE MARLY ─────────────────────────────────────────────────────────
  { nome: "Layton",                      tipo: "EDP", genero: "Masculino", marca: "Parfums de Marly", familia: "Aromático Gourmand",  notas: ["Maçã", "Lavanda", "Cardamomo", "Baunilha", "Sândalo", "Âmbar"],                            preco_brl: 800, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },
  { nome: "Pegasus",                     tipo: "EDP", genero: "Masculino", marca: "Parfums de Marly", familia: "Aromático Floral",    notas: ["Bergamota", "Lavanda", "Heliotropo", "Baunilha", "Âmbar"],                                 preco_brl: 800, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },
  { nome: "Percival",                    tipo: "EDP", genero: "Masculino", marca: "Parfums de Marly", familia: "Aromático Gourmand",  notas: ["Lavanda", "Sálvia", "Maçã", "Baunilha", "Âmbar"],                                          preco_brl: 750, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },
  { nome: "Sedley",                      tipo: "EDP", genero: "Masculino", marca: "Parfums de Marly", familia: "Aromático Fougère",   notas: ["Menta", "Lavanda", "Cedro", "Âmbar"],                                                      preco_brl: 750, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },
  { nome: "Delina",                      tipo: "EDP", genero: "Feminino",  marca: "Parfums de Marly", familia: "Floral Frutal",       notas: ["Litchi", "Rosa", "Peônia", "Frésia", "Almíscar", "Âmbar"],                                 preco_brl: 900, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },
  { nome: "Delina Exclusif",             tipo: "EDP", genero: "Feminino",  marca: "Parfums de Marly", familia: "Floral Amadeirado",   notas: ["Litchi", "Rosa", "Magnólia", "Âmbar", "Almíscar"],                                         preco_brl: 950, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },
  { nome: "Cassili",                     tipo: "EDP", genero: "Feminino",  marca: "Parfums de Marly", familia: "Floral Almíscaro",    notas: ["Rosa", "Peônia", "Âmbar", "Almíscar"],                                                     preco_brl: 800, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },

  // ── MAISON FRANCIS KURKDJIAN ─────────────────────────────────────────────────
  { nome: "Baccarat Rouge 540",          tipo: "EDP", genero: "Unissex",   marca: "Maison Francis Kurkdjian", familia: "Floral Amadeirado", notas: ["Açafrão", "Jasmim", "Âmbar", "Cedro"],                                             preco_brl: 1400, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },
  { nome: "Baccarat Rouge 540 Extrait",  tipo: "Extrait", genero: "Unissex", marca: "Maison Francis Kurkdjian", familia: "Floral Amadeirado", notas: ["Açafrão", "Amêndoa amarga", "Âmbar", "Cedro"],                                   preco_brl: 1800, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },
  { nome: "Grand Soir",                  tipo: "EDP", genero: "Unissex",   marca: "Maison Francis Kurkdjian", familia: "Oriental Amadeirado", notas: ["Baunilha", "Âmbar", "Benzoim", "Almíscar"],                                      preco_brl: 1200, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },
  { nome: "Gentle Fluidity Silver",      tipo: "EDP", genero: "Unissex",   marca: "Maison Francis Kurkdjian", familia: "Aromático",          notas: ["Almíscar", "Genebro", "Baunilha", "Âmbar"],                                        preco_brl: 1200, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },
  { nome: "Gentle Fluidity Gold",        tipo: "EDP", genero: "Unissex",   marca: "Maison Francis Kurkdjian", familia: "Oriental Aromático", notas: ["Noz-moscada", "Baunilha", "Âmbar", "Almíscar"],                                    preco_brl: 1200, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },

  // ── XERJOFF ──────────────────────────────────────────────────────────────────
  { nome: "Naxos",                       tipo: "EDP", genero: "Unissex",   marca: "Xerjoff", familia: "Oriental Gourmand",            notas: ["Bergamota", "Lavanda", "Mel", "Tabaco", "Baunilha"],                                       preco_brl: 1200, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },
  { nome: "Erba Pura",                   tipo: "EDP", genero: "Unissex",   marca: "Xerjoff", familia: "Floral Cítrico",               notas: ["Bergamota", "Laranja", "Rosa", "Almíscar", "Âmbar"],                                       preco_brl: 1100, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },
  { nome: "Alexandria II",               tipo: "EDP", genero: "Unissex",   marca: "Xerjoff", familia: "Floral Oriental",              notas: ["Bergamota", "Rosa", "Baunilha", "Âmbar", "Almíscar"],                                      preco_brl: 1200, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },
  { nome: "Nio",                         tipo: "EDP", genero: "Masculino", marca: "Xerjoff", familia: "Aromático Amadeirado",         notas: ["Bergamota", "Cardamomo", "Sândalo", "Âmbar"],                                              preco_brl: 1000, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },

  // ── NISHANE ──────────────────────────────────────────────────────────────────
  { nome: "Hacivat",                     tipo: "EDP", genero: "Unissex",   marca: "Nishane", familia: "Amadeirado Floral",            notas: ["Bergamota", "Abacaxi", "Rosa", "Patchouli", "Âmbar"],                                      preco_brl: 850, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },
  { nome: "Ani",                         tipo: "EDP", genero: "Unissex",   marca: "Nishane", familia: "Floral Almíscaro",             notas: ["Bergamota", "Rosa", "Almíscar", "Âmbar"],                                                  preco_brl: 850, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },
  { nome: "Hundred Silent Ways",         tipo: "EDP", genero: "Unissex",   marca: "Nishane", familia: "Floral Oriental",              notas: ["Açafrão", "Rosa", "Âmbar", "Cedro"],                                                       preco_brl: 800, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },

  // ── MANCERA ──────────────────────────────────────────────────────────────────
  { nome: "Cedrat Boise",                tipo: "EDP", genero: "Masculino", marca: "Mancera", familia: "Cítrico Amadeirado",           notas: ["Bergamota", "Limão", "Cedro", "Sândalo", "Âmbar"],                                         preco_brl: 700, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },
  { nome: "Red Tobacco",                 tipo: "EDP", genero: "Masculino", marca: "Mancera", familia: "Oriental Amadeirado",          notas: ["Tabaco", "Âmbar", "Baunilha", "Patchouli"],                                                preco_brl: 700, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },
  { nome: "Instant Crush",               tipo: "EDP", genero: "Unissex",   marca: "Mancera", familia: "Floral Oriental",              notas: ["Rosa", "Jasmim", "Âmbar", "Almíscar"],                                                     preco_brl: 700, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },
  { nome: "Roses Vanille",               tipo: "EDP", genero: "Feminino",  marca: "Mancera", familia: "Floral Gourmand",              notas: ["Rosa", "Baunilha", "Âmbar", "Almíscar"],                                                   preco_brl: 700, categoria: "nicho", inspiradoEm: null, marcaOriginal: null },

  // ── NACIONAIS — O BOTICÁRIO ───────────────────────────────────────────────────
  { nome: "Malbec X",                    tipo: "EDP", genero: "Masculino", marca: "O Boticário", familia: "Amadeirado Especiado",    notas: ["Pimenta", "Cedro", "Âmbar", "Couro"],                                                       preco_brl: 130, categoria: "nacional", inspiradoEm: null, marcaOriginal: null },
  { nome: "Malbec Noir",                 tipo: "EDP", genero: "Masculino", marca: "O Boticário", familia: "Oriental Amadeirado",     notas: ["Açafrão", "Couro", "Âmbar", "Patchouli"],                                                   preco_brl: 140, categoria: "nacional", inspiradoEm: null, marcaOriginal: null },
  { nome: "Malbec Club",                 tipo: "EDT", genero: "Masculino", marca: "O Boticário", familia: "Aromático Amadeirado",    notas: ["Pimenta", "Cedro", "Almíscar"],                                                             preco_brl: 110, categoria: "nacional", inspiradoEm: null, marcaOriginal: null },
  { nome: "Lily Absolu",                 tipo: "EDP", genero: "Feminino",  marca: "O Boticário", familia: "Floral",                  notas: ["Lírio", "Âmbar", "Almíscar"],                                                              preco_brl: 150, categoria: "nacional", inspiradoEm: null, marcaOriginal: null },
  { nome: "Liz",                         tipo: "EDP", genero: "Feminino",  marca: "O Boticário", familia: "Floral Almíscaro",        notas: ["Rosa", "Peônia", "Almíscar", "Sândalo"],                                                    preco_brl: 130, categoria: "nacional", inspiradoEm: null, marcaOriginal: null },
  { nome: "Coffee Man",                  tipo: "EDT", genero: "Masculino", marca: "O Boticário", familia: "Aromático Gourmand",      notas: ["Café", "Bergamota", "Cedro", "Âmbar"],                                                     preco_brl: 130, categoria: "nacional", inspiradoEm: null, marcaOriginal: null },
  { nome: "Arbo",                        tipo: "EDT", genero: "Masculino", marca: "O Boticário", familia: "Aromático Amadeirado",    notas: ["Bergamota", "Cardamomo", "Cedro", "Âmbar"],                                                 preco_brl: 100, categoria: "nacional", inspiradoEm: null, marcaOriginal: null },
  { nome: "Make B.",                     tipo: "EDP", genero: "Feminino",  marca: "O Boticário", familia: "Floral Oriental",         notas: ["Rosa", "Baunilha", "Âmbar", "Almíscar"],                                                    preco_brl: 150, categoria: "nacional", inspiradoEm: null, marcaOriginal: null },

  // ── NACIONAIS — NATURA ───────────────────────────────────────────────────────
  { nome: "Essencial Exclusivo",         tipo: "EDP", genero: "Masculino", marca: "Natura", familia: "Aromático Amadeirado",         notas: ["Bergamota", "Couro", "Âmbar", "Vetiver"],                                                   preco_brl: 180, categoria: "nacional", inspiradoEm: null, marcaOriginal: null },
  { nome: "Essencial Elixir",            tipo: "EDP", genero: "Masculino", marca: "Natura", familia: "Aromático Amadeirado",         notas: ["Bergamota", "Cedro", "Almíscar"],                                                           preco_brl: 150, categoria: "nacional", inspiradoEm: null, marcaOriginal: null },
  { nome: "Humor",                       tipo: "EDT", genero: "Masculino", marca: "Natura", familia: "Aromático",                    notas: ["Bergamota", "Lavanda", "Âmbar"],                                                            preco_brl: 120, categoria: "nacional", inspiradoEm: null, marcaOriginal: null },
  { nome: "Luna Absoluta",               tipo: "EDP", genero: "Feminino",  marca: "Natura", familia: "Floral Oriental",              notas: ["Rosa", "Jasmim", "Baunilha", "Âmbar"],                                                      preco_brl: 150, categoria: "nacional", inspiradoEm: null, marcaOriginal: null },
  { nome: "Ilía",                        tipo: "EDP", genero: "Feminino",  marca: "Natura", familia: "Floral Almíscaro",             notas: ["Rosa", "Peônia", "Almíscar", "Âmbar"],                                                      preco_brl: 180, categoria: "nacional", inspiradoEm: null, marcaOriginal: null },
  { nome: "Essencial Feminino",          tipo: "EDP", genero: "Feminino",  marca: "Natura", familia: "Floral",                       notas: ["Rosa", "Jasmim", "Cedro", "Almíscar"],                                                      preco_brl: 150, categoria: "nacional", inspiradoEm: null, marcaOriginal: null },

  // ── NACIONAIS — EUDORA ───────────────────────────────────────────────────────
  { nome: "Egeo Beat",                   tipo: "EDT", genero: "Feminino",  marca: "Eudora", familia: "Floral Frutal",                notas: ["Frutas vermelhas", "Rosa", "Almíscar"],                                                     preco_brl: 120, categoria: "nacional", inspiradoEm: null, marcaOriginal: null },
  { nome: "Kiss Me Lovely",              tipo: "EDT", genero: "Feminino",  marca: "Eudora", familia: "Floral Almíscaro",             notas: ["Rosa", "Baunilha", "Almíscar"],                                                             preco_brl: 100, categoria: "nacional", inspiradoEm: null, marcaOriginal: null },
  { nome: "Pulse",                       tipo: "EDT", genero: "Masculino", marca: "Eudora", familia: "Aromático",                    notas: ["Bergamota", "Cardamomo", "Cedro"],                                                          preco_brl: 110, categoria: "nacional", inspiradoEm: null, marcaOriginal: null },
  { nome: "Club 6",                      tipo: "EDT", genero: "Masculino", marca: "Eudora", familia: "Aromático Amadeirado",         notas: ["Bergamota", "Sálvia", "Cedro", "Âmbar"],                                                    preco_brl: 120, categoria: "nacional", inspiradoEm: null, marcaOriginal: null },

  // ── CONTRATIPOS — IN THE BOX ──────────────────────────────────────────────────
  { nome: "Adventure",                   tipo: "EDP", genero: "Masculino", marca: "In The Box", familia: "Amadeirado Frutal",        notas: ["Abacaxi", "Bétula", "Almíscar", "Âmbar"],                                                  preco_brl: 120, categoria: "contratipo", inspiradoEm: "Aventus", marcaOriginal: "Creed" },
  { nome: "Savage",                      tipo: "EDT", genero: "Masculino", marca: "In The Box", familia: "Aromático Amadeirado",     notas: ["Pimenta", "Bergamota", "Ambroxan", "Âmbar"],                                               preco_brl: 120, categoria: "contratipo", inspiradoEm: "Sauvage", marcaOriginal: "Dior" },
  { nome: "Blue Channel",                tipo: "EDP", genero: "Masculino", marca: "In The Box", familia: "Aromático Amadeirado",     notas: ["Bergamota", "Cedro", "Âmbar", "Almíscar"],                                                  preco_brl: 120, categoria: "contratipo", inspiradoEm: "Bleu de Chanel", marcaOriginal: "Chanel" },
  { nome: "One Milion",                  tipo: "EDT", genero: "Masculino", marca: "In The Box", familia: "Oriental Especiado",       notas: ["Toranja", "Canela", "Patchouli", "Âmbar"],                                                 preco_brl: 110, categoria: "contratipo", inspiradoEm: "1 Million", marcaOriginal: "Paco Rabanne" },
  { nome: "Invictory",                   tipo: "EDT", genero: "Masculino", marca: "In The Box", familia: "Aromático Aquático",       notas: ["Toranja", "Pimenta", "Almíscar", "Âmbar"],                                                 preco_brl: 110, categoria: "contratipo", inspiradoEm: "Invictus", marcaOriginal: "Paco Rabanne" },
  { nome: "Black Code",                  tipo: "EDT", genero: "Masculino", marca: "In The Box", familia: "Oriental Amadeirado",      notas: ["Bergamota", "Baunilha", "Couro", "Âmbar"],                                                 preco_brl: 110, categoria: "contratipo", inspiradoEm: "Armani Code", marcaOriginal: "Giorgio Armani" },
  { nome: "Vida Bela",                   tipo: "EDP", genero: "Feminino",  marca: "In The Box", familia: "Floral Gourmand",          notas: ["Pralinê", "Íris", "Baunilha", "Patchouli"],                                                preco_brl: 110, categoria: "contratipo", inspiradoEm: "La Vie Est Belle", marcaOriginal: "Lancôme" },
  { nome: "Good Woman",                  tipo: "EDP", genero: "Feminino",  marca: "In The Box", familia: "Floral Oriental",          notas: ["Café", "Tuberose", "Baunilha", "Patchouli"],                                               preco_brl: 110, categoria: "contratipo", inspiradoEm: "Good Girl", marcaOriginal: "Carolina Herrera" },
  { nome: "Black Night",                 tipo: "EDP", genero: "Feminino",  marca: "In The Box", familia: "Oriental Gourmand",        notas: ["Café", "Baunilha", "Patchouli", "Almíscar"],                                               preco_brl: 110, categoria: "contratipo", inspiradoEm: "Black Opium", marcaOriginal: "Yves Saint Laurent" },
  { nome: "Olimpus",                     tipo: "EDP", genero: "Feminino",  marca: "In The Box", familia: "Floral Oriental",          notas: ["Pimenta rosa", "Baunilha", "Almíscar", "Âmbar"],                                           preco_brl: 110, categoria: "contratipo", inspiradoEm: "Olympéa", marcaOriginal: "Paco Rabanne" },
]

// ─────────────────────────────────────────────────────────────────────────────
// LÓGICA DE EXECUÇÃO COM CHECKPOINT
// ─────────────────────────────────────────────────────────────────────────────

function carregarExpandido() {
  const raw = readFileSync(EXPANDIDO_PATH, 'utf-8')
  return JSON.parse(raw)
}

function salvarExpandido(data) {
  writeFileSync(EXPANDIDO_PATH, JSON.stringify(data, null, 2), 'utf-8')
}

function carregarCheckpoint() {
  if (!existsSync(CHECKPOINT_PATH)) return { ultimoProcessado: null, totalProcessados: 0 }
  return JSON.parse(readFileSync(CHECKPOINT_PATH, 'utf-8'))
}

function salvarCheckpoint(ultimoProcessado, totalProcessados, totalRestantes) {
  writeFileSync(CHECKPOINT_PATH, JSON.stringify({ ultimoProcessado, totalProcessados, totalRestantes }, null, 2), 'utf-8')
}

async function main() {
  const expandido = carregarExpandido()
  const idsExistentes = new Set(expandido.map(p => p.id))
  const nomeMarcaExistentes = new Set(expandido.map(p => `${p.nome.toLowerCase()}|${p.marca.toLowerCase()}`))

  const checkpoint = carregarCheckpoint()
  let iniciar = checkpoint.ultimoProcessado === null

  let adicionados = checkpoint.totalProcessados
  let pulados = 0

  console.log(`\n=== Enriquecimento perfumes-expandido.json ===`)
  console.log(`Total atual: ${expandido.length}`)
  console.log(`Perfumes a processar: ${NOVOS_PERFUMES.length}`)
  if (checkpoint.ultimoProcessado) {
    console.log(`Retomando após: "${checkpoint.ultimoProcessado}"`)
  }
  console.log('')

  for (let i = 0; i < NOVOS_PERFUMES.length; i++) {
    const p = NOVOS_PERFUMES[i]
    const id = makeId(p.nome, p.marca)
    const chave = `${p.nome.toLowerCase()}|${p.marca.toLowerCase()}`

    // Retomada de checkpoint
    if (!iniciar) {
      if (`${p.nome}|${p.marca}` === checkpoint.ultimoProcessado) {
        iniciar = true
      }
      continue
    }

    // Verifica duplicata
    if (idsExistentes.has(id) || nomeMarcaExistentes.has(chave)) {
      console.log(`  PULADO (já existe): ${p.nome} — ${p.marca}`)
      pulados++
      continue
    }

    // Monta o objeto final
    const novo = {
      id,
      nome: p.nome,
      marca: p.marca,
      tipo: p.tipo,
      genero: p.genero,
      inspiradoEm: p.inspiradoEm ?? null,
      marcaOriginal: p.marcaOriginal ?? null,
      familia: p.familia,
      notas: p.notas,
      preco_brl: p.preco_brl,
      categoria: p.categoria,
      disponivel: true,
      linkCompra: "",
    }

    expandido.push(novo)
    idsExistentes.add(id)
    nomeMarcaExistentes.add(chave)
    adicionados++

    // Salva imediatamente após cada adição
    salvarExpandido(expandido)
    salvarCheckpoint(`${p.nome}|${p.marca}`, adicionados, NOVOS_PERFUMES.length - i - 1)

    console.log(`  [${adicionados}] ADICIONADO: ${p.nome} — ${p.marca} (${p.tipo}, ${p.genero})`)
  }

  console.log(`\n=== Concluído ===`)
  console.log(`Adicionados: ${adicionados - checkpoint.totalProcessados}`)
  console.log(`Pulados (duplicata): ${pulados}`)
  console.log(`Total expandido agora: ${expandido.length}`)
}

main().catch(err => {
  console.error('ERRO:', err)
  process.exit(1)
})
