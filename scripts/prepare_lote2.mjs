import fs from 'fs';
import path from 'path';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/--+/g, '-')
    .trim();
}

const EXPANDIDO_PATH = 'data/perfumes-expandido.json';
const LOTE2_PATH = 'scripts/perfumes-lote2.json';

// Carrega perfumes existentes para evitar duplicatas
const expandidoRaw = fs.readFileSync(EXPANDIDO_PATH, 'utf8');
const expandido = JSON.parse(expandidoRaw);
const existingSlugs = new Set(expandido.map(p => p.id));
const existingNames = new Set(expandido.map(p => `${slugify(p.nome)}|${slugify(p.marca)}`));

// Lista de candidatos organizada pelos blocos solicitados
const candidatosRaw = [
  // ==========================================
  // Bloco A — Flankers das marcas já cobertas
  // ==========================================
  { nome: "Sauvage Elixir", marca: "Dior", tipo: "Extrait", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Sauvage Parfum", marca: "Dior", tipo: "Parfum", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Miss Dior Blooming Bouquet", marca: "Dior", tipo: "EDT", genero: "Feminino", categoria: "importado-designer" },
  { nome: "J'adore Infinissime", marca: "Dior", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Dior Homme Intense", marca: "Dior", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Dior Homme Parfum", marca: "Dior", tipo: "Parfum", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Dior Homme Sport", marca: "Dior", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Fahrenheit Parfum", marca: "Dior", tipo: "Parfum", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Miss Dior Parfum", marca: "Dior", tipo: "Parfum", genero: "Feminino", categoria: "importado-designer" },

  { nome: "Chance EDP", marca: "Chanel", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Gabrielle", marca: "Chanel", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Gabrielle Essence", marca: "Chanel", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Bleu de Chanel Parfum", marca: "Chanel", tipo: "Parfum", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Allure Homme Sport Eau Extreme", marca: "Chanel", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Coco EDP", marca: "Chanel", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Allure Homme Sport", marca: "Chanel", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Allure Homme Edition Blanche", marca: "Chanel", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Coco Mademoiselle Intense", marca: "Chanel", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },

  { nome: "1 Million Royal", marca: "Paco Rabanne", tipo: "Parfum", genero: "Masculino", categoria: "importado-designer" },
  { nome: "1 Million Elixir", marca: "Paco Rabanne", tipo: "Parfum", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Invictus Platinum", marca: "Paco Rabanne", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Invictus Victory Elixir", marca: "Paco Rabanne", tipo: "Parfum", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Lady Million Lucky", marca: "Paco Rabanne", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Lady Million Fabulous", marca: "Paco Rabanne", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Phantom Parfum", marca: "Paco Rabanne", tipo: "Parfum", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Phantom Intense", marca: "Paco Rabanne", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Lady Million Royal", marca: "Paco Rabanne", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },

  { nome: "212 Heroes Men", marca: "Carolina Herrera", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "212 Heroes Her", marca: "Carolina Herrera", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "212 NYC Men", marca: "Carolina Herrera", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Good Girl Blush", marca: "Carolina Herrera", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Good Girl Blush Elixir", marca: "Carolina Herrera", tipo: "Parfum", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Good Girl Legere", marca: "Carolina Herrera", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Good Girl Supreme", marca: "Carolina Herrera", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "CH Men Prive", marca: "Carolina Herrera", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "212 VIP Men Party Fever", marca: "Carolina Herrera", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Bad Boy Cobalt", marca: "Carolina Herrera", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Bad Boy Extreme", marca: "Carolina Herrera", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },

  { nome: "Y Elixir", marca: "Yves Saint Laurent", tipo: "Parfum", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Y Le Parfum", marca: "Yves Saint Laurent", tipo: "Parfum", genero: "Masculino", categoria: "importado-designer" },
  { nome: "MYSLF", marca: "Yves Saint Laurent", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "MYSLF Le Parfum", marca: "Yves Saint Laurent", tipo: "Parfum", genero: "Masculino", categoria: "importado-designer" },
  { nome: "La Nuit de L'Homme Bleu Electrique", marca: "Yves Saint Laurent", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "La Nuit de L'Homme Le Parfum", marca: "Yves Saint Laurent", tipo: "Parfum", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Black Opium Le Parfum", marca: "Yves Saint Laurent", tipo: "Parfum", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Black Opium Over Red", marca: "Yves Saint Laurent", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Libre Le Parfum", marca: "Yves Saint Laurent", tipo: "Parfum", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Libre Platine", marca: "Yves Saint Laurent", tipo: "Parfum", genero: "Feminino", categoria: "importado-designer" },

  { nome: "Dylan Blue Pour Homme Parfum", marca: "Versace", tipo: "Parfum", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Eros Parfum", marca: "Versace", tipo: "Parfum", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Versace Man Eau Fraiche", marca: "Versace", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Versace Pour Femme Dylan Blue", marca: "Versace", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Versace Pour Femme Dylan Purple", marca: "Versace", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Versace Pour Femme Dylan Turquoise", marca: "Versace", tipo: "EDT", genero: "Feminino", categoria: "importado-designer" },

  { nome: "The One Intense", marca: "Dolce & Gabbana", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "The One EDP Pour Homme", marca: "Dolce & Gabbana", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Light Blue Forever Pour Homme", marca: "Dolce & Gabbana", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Light Blue Forever Pour Femme", marca: "Dolce & Gabbana", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Light Blue Italian Love Pour Homme", marca: "Dolce & Gabbana", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Light Blue Summer Vibes Pour Homme", marca: "Dolce & Gabbana", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "K by Dolce & Gabbana Parfum", marca: "Dolce & Gabbana", tipo: "Parfum", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Q by Dolce & Gabbana", marca: "Dolce & Gabbana", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },

  { nome: "Born in Roma Donna Intense", marca: "Valentino", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Born in Roma Uomo Intense", marca: "Valentino", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Voce Viva", marca: "Valentino", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Voce Viva Intensa", marca: "Valentino", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Uomo Noir Absolu", marca: "Valentino", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },

  { nome: "Gentleman Reserve Privee", marca: "Givenchy", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Gentleman Society", marca: "Givenchy", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Gentleman Society Extreme", marca: "Givenchy", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "L'Interdit Intense", marca: "Givenchy", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "L'Interdit Rouge", marca: "Givenchy", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "L'Interdit Rouge Ultime", marca: "Givenchy", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Irresistible Very Floral", marca: "Givenchy", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },

  { nome: "Boss Bottled Parfum", marca: "Hugo Boss", tipo: "Parfum", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Boss Bottled Night", marca: "Hugo Boss", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Boss Bottled Elixir", marca: "Hugo Boss", tipo: "Parfum", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Boss Alive", marca: "Hugo Boss", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Boss Alive Intense", marca: "Hugo Boss", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Boss Ma Vie", marca: "Hugo Boss", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Boss The Scent Elixir Him", marca: "Hugo Boss", tipo: "Parfum", genero: "Masculino", categoria: "importado-designer" },

  { nome: "Le Male Elixir", marca: "Jean Paul Gaultier", tipo: "Parfum", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Le Beau Paradise Garden", marca: "Jean Paul Gaultier", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Scandal Le Parfum Homme", marca: "Jean Paul Gaultier", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Scandal Le Parfum Femme", marca: "Jean Paul Gaultier", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "La Belle", marca: "Jean Paul Gaultier", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "La Belle Le Parfum", marca: "Jean Paul Gaultier", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "So Scandal", marca: "Jean Paul Gaultier", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Gaultier Divine", marca: "Jean Paul Gaultier", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },

  { nome: "La Vie Est Belle L'Eclat", marca: "Lancome", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "La Vie Est Belle Oui", marca: "Lancome", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "La Vie Est Belle Iris Absolu", marca: "Lancome", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Idole L'Intense", marca: "Lancome", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Idole Now", marca: "Lancome", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Tresor Midnight Rose", marca: "Lancome", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "O de Lancome", marca: "Lancome", tipo: "EDT", genero: "Feminino", categoria: "importado-designer" },

  { nome: "Luna Rossa Sport", marca: "Prada", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Luna Rossa Ocean EDP", marca: "Prada", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Luna Rossa Black", marca: "Prada", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Paradoxe Intense", marca: "Prada", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Prada Candy Night", marca: "Prada", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Prada L'Homme L'Eau", marca: "Prada", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Prada L'Homme Intense", marca: "Prada", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Infusion de Fleur d'Oranger", marca: "Prada", tipo: "EDP", genero: "Unissex", categoria: "importado-designer" },

  { nome: "Ombre Leather EDP", marca: "Tom Ford", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Ombre Leather Parfum", marca: "Tom Ford", tipo: "Parfum", genero: "Unissex", categoria: "nicho" },
  { nome: "Noir Extreme Parfum", marca: "Tom Ford", tipo: "Parfum", genero: "Masculino", categoria: "nicho" },
  { nome: "Costa Azzurra EDP", marca: "Tom Ford", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Soleil Blanc", marca: "Tom Ford", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Cafe Rose", marca: "Tom Ford", tipo: "EDP", genero: "Feminino", categoria: "nicho" },
  { nome: "Rose Prick", marca: "Tom Ford", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "White Suede", marca: "Tom Ford", tipo: "EDP", genero: "Feminino", categoria: "nicho" },
  { nome: "Metallique", marca: "Tom Ford", tipo: "EDP", genero: "Feminino", categoria: "nicho" },
  { nome: "Grey Vetiver EDP", marca: "Tom Ford", tipo: "EDP", genero: "Masculino", categoria: "nicho" },

  { nome: "Explorer Platinum", marca: "Montblanc", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Legend EDP", marca: "Montblanc", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Explorer Ultra Blue", marca: "Montblanc", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Legend Red", marca: "Montblanc", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },

  { nome: "Angel Nova", marca: "Mugler", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Alien Goddess", marca: "Mugler", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Alien Goddess Intense", marca: "Mugler", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },

  { nome: "Royal Oud", marca: "Creed", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Millesime Imperial", marca: "Creed", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Wind Flowers", marca: "Creed", tipo: "EDP", genero: "Feminino", categoria: "nicho" },
  { nome: "Love in Black", marca: "Creed", tipo: "EDP", genero: "Feminino", categoria: "nicho" },
  { nome: "Silver Mountain Water", marca: "Creed", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Green Irish Tweed", marca: "Creed", tipo: "EDP", genero: "Masculino", categoria: "nicho" },
  { nome: "Viking", marca: "Creed", tipo: "EDP", genero: "Masculino", categoria: "nicho" },

  // ==========================================
  // Bloco B — Marcas nicho faltantes
  // ==========================================
  { nome: "Gypsy Water", marca: "Byredo", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Mojave Ghost", marca: "Byredo", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Bal d'Afrique", marca: "Byredo", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Blanche", marca: "Byredo", tipo: "EDP", genero: "Feminino", categoria: "nicho" },
  { nome: "Rose of No Man's Land", marca: "Byredo", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Mumbai Noise", marca: "Byredo", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "De Los Santos", marca: "Byredo", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Super Cedar", marca: "Byredo", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Black Saffron", marca: "Byredo", tipo: "EDP", genero: "Unissex", categoria: "nicho" },

  { nome: "Santal 33", marca: "Le Labo", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Another 13", marca: "Le Labo", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Rose 31", marca: "Le Labo", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "The Noir 29", marca: "Le Labo", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Bergamote 22", marca: "Le Labo", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Patchouli 24", marca: "Le Labo", tipo: "EDP", genero: "Unissex", categoria: "nicho" },

  { nome: "Interlude Man", marca: "Amouage", tipo: "EDP", genero: "Masculino", categoria: "nicho" },
  { nome: "Reflection Man", marca: "Amouage", tipo: "EDP", genero: "Masculino", categoria: "nicho" },
  { nome: "Jubilation XXV Man", marca: "Amouage", tipo: "EDP", genero: "Masculino", categoria: "nicho" },
  { nome: "Honour Man", marca: "Amouage", tipo: "EDP", genero: "Masculino", categoria: "nicho" },
  { nome: "Epic Man", marca: "Amouage", tipo: "EDP", genero: "Masculino", categoria: "nicho" },
  { nome: "Memoir Man", marca: "Amouage", tipo: "EDP", genero: "Masculino", categoria: "nicho" },
  { nome: "Guidance", marca: "Amouage", tipo: "EDP", genero: "Feminino", categoria: "nicho" },
  { nome: "Lyric Man", marca: "Amouage", tipo: "EDP", genero: "Masculino", categoria: "nicho" },

  { nome: "Philosykos", marca: "Diptyque", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Tam Dao", marca: "Diptyque", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Do Son", marca: "Diptyque", tipo: "EDP", genero: "Feminino", categoria: "nicho" },
  { nome: "Eau Duelle", marca: "Diptyque", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "L'Ombre Dans L'Eau", marca: "Diptyque", tipo: "EDP", genero: "Feminino", categoria: "nicho" },

  { nome: "Halfeti", marca: "Penhaligon's", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Empressa", marca: "Penhaligon's", tipo: "EDT", genero: "Feminino", categoria: "nicho" },
  { nome: "Lothair", marca: "Penhaligon's", tipo: "EDT", genero: "Unissex", categoria: "nicho" },
  { nome: "The Tragedy of Lord George", marca: "Penhaligon's", tipo: "EDP", genero: "Masculino", categoria: "nicho" },
  { nome: "The Coveted Duchess Rose", marca: "Penhaligon's", tipo: "EDP", genero: "Feminino", categoria: "nicho" },

  { nome: "Colonia", marca: "Acqua di Parma", tipo: "EDC", genero: "Unissex", categoria: "nicho" },
  { nome: "Colonia Essenza", marca: "Acqua di Parma", tipo: "EDC", genero: "Masculino", categoria: "nicho" },
  { nome: "Fico di Amalfi", marca: "Acqua di Parma", tipo: "EDT", genero: "Unissex", categoria: "nicho" },
  { nome: "Mirto di Panarea", marca: "Acqua di Parma", tipo: "EDT", genero: "Unissex", categoria: "nicho" },
  { nome: "Arancia di Capri", marca: "Acqua di Parma", tipo: "EDT", genero: "Unissex", categoria: "nicho" },

  { nome: "Jazz Club", marca: "Maison Margiela", tipo: "EDT", genero: "Masculino", categoria: "nicho" },
  { nome: "By the Fireplace", marca: "Maison Margiela", tipo: "EDT", genero: "Unissex", categoria: "nicho" },
  { nome: "Coffee Break", marca: "Maison Margiela", tipo: "EDT", genero: "Unissex", categoria: "nicho" },
  { nome: "Lazy Sunday Morning", marca: "Maison Margiela", tipo: "EDT", genero: "Feminino", categoria: "nicho" },
  { nome: "Bubble Bath", marca: "Maison Margiela", tipo: "EDT", genero: "Unissex", categoria: "nicho" },
  { nome: "Under the Lemon Trees", marca: "Maison Margiela", tipo: "EDT", genero: "Unissex", categoria: "nicho" },

  { nome: "La Fille de Berlin", marca: "Serge Lutens", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Chergui", marca: "Serge Lutens", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Feminite du Bois", marca: "Serge Lutens", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Ambre Sultan", marca: "Serge Lutens", tipo: "EDP", genero: "Unissex", categoria: "nicho" },

  { nome: "Good Girl Gone Bad", marca: "Kilian", tipo: "EDP", genero: "Feminino", categoria: "nicho" },
  { nome: "Angels' Share", marca: "Kilian", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Apple Brandy on the Rocks", marca: "Kilian", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Love Don't Be Shy", marca: "Kilian", tipo: "EDP", genero: "Feminino", categoria: "nicho" },
  { nome: "Sacred Wood", marca: "Kilian", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Black Phantom", marca: "Kilian", tipo: "EDP", genero: "Unissex", categoria: "nicho" },

  { nome: "Elysium Pour Homme", marca: "Roja Parfums", tipo: "Parfum", genero: "Masculino", categoria: "nicho" },
  { nome: "Enigma Pour Homme", marca: "Roja Parfums", tipo: "Parfum", genero: "Masculino", categoria: "nicho" },
  { nome: "Scandal Pour Homme", marca: "Roja Parfums", tipo: "Parfum", genero: "Masculino", categoria: "nicho" },
  { nome: "Danger Pour Homme", marca: "Roja Parfums", tipo: "Parfum", genero: "Masculino", categoria: "nicho" },
  { nome: "Apex", marca: "Roja Parfums", tipo: "EDP", genero: "Masculino", categoria: "nicho" },

  { nome: "Portrait of a Lady", marca: "Frederic Malle", tipo: "EDP", genero: "Feminino", categoria: "nicho" },
  { nome: "Musc Ravageur", marca: "Frederic Malle", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Carnal Flower", marca: "Frederic Malle", tipo: "EDP", genero: "Unissex", categoria: "nicho" },

  { nome: "Wood Sage & Sea Salt", marca: "Jo Malone", tipo: "EDC", genero: "Unissex", categoria: "nicho" },
  { nome: "Peony & Blush Suede", marca: "Jo Malone", tipo: "EDC", genero: "Feminino", categoria: "nicho" },
  { nome: "Myrrh & Tonka", marca: "Jo Malone", tipo: "Cologne Intense", genero: "Unissex", categoria: "nicho" },
  { nome: "Lime Basil & Mandarin", marca: "Jo Malone", tipo: "EDC", genero: "Unissex", categoria: "nicho" },
  { nome: "Pomegranate Noir", marca: "Jo Malone", tipo: "EDC", genero: "Unissex", categoria: "nicho" },
  { nome: "Velvet Rose & Oud", marca: "Jo Malone", tipo: "Cologne Intense", genero: "Unissex", categoria: "nicho" },
  { nome: "English Pear & Freesia", marca: "Jo Malone", tipo: "EDC", genero: "Feminino", categoria: "nicho" },

  // ==========================================
  // Bloco C — Árabes que faltam
  // ==========================================
  { nome: "Yara Tous", marca: "Lattafa", tipo: "EDP", genero: "Feminino", categoria: "arabe" },
  { nome: "Yara Moi", marca: "Lattafa", tipo: "EDP", genero: "Feminino", categoria: "arabe" },
  { nome: "Asad Zanzibar", marca: "Lattafa", tipo: "EDP", genero: "Masculino", categoria: "arabe" },
  { nome: "Khamrah Qahwa", marca: "Lattafa", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Raghba Wood Intense", marca: "Lattafa", tipo: "EDP", genero: "Masculino", categoria: "arabe" },
  { nome: "Fakhar Rose", marca: "Lattafa", tipo: "EDP", genero: "Feminino", categoria: "arabe" },
  { nome: "Maahir Black Edition", marca: "Lattafa", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Bade'e Al Oud Amethyst", marca: "Lattafa", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Bade'e Al Oud Honor & Glory", marca: "Lattafa", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Qaed Al Fursan Unlimited", marca: "Lattafa", tipo: "EDP", genero: "Unissex", categoria: "arabe" },

  { nome: "Jean Lowe Immortal", marca: "Maison Alhambra", tipo: "EDP", genero: "Masculino", categoria: "arabe" },
  { nome: "Jean Lowe Matiere", marca: "Maison Alhambra", tipo: "EDP", genero: "Feminino", categoria: "arabe" },
  { nome: "Exclusif Tabac", marca: "Maison Alhambra", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Amberley Pur Oud", marca: "Maison Alhambra", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Russe Leather", marca: "Maison Alhambra", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Hercules", marca: "Maison Alhambra", tipo: "EDP", genero: "Masculino", categoria: "arabe" },
  { nome: "Porto Neroli", marca: "Maison Alhambra", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Bright Peach", marca: "Maison Alhambra", tipo: "EDP", genero: "Unissex", categoria: "arabe" },

  { nome: "9 AM", marca: "Afnan", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "9 PM", marca: "Afnan", tipo: "EDP", genero: "Masculino", categoria: "arabe" },
  { nome: "Rare Toffee", marca: "Afnan", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Supremacy Gold", marca: "Afnan", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Turathi Gold", marca: "Afnan", tipo: "EDP", genero: "Feminino", categoria: "arabe" },
  { nome: "Turathi Blue", marca: "Afnan", tipo: "EDP", genero: "Masculino", categoria: "arabe" },
  { nome: "Edict Musky Oud", marca: "Afnan", tipo: "EDP", genero: "Unissex", categoria: "arabe" },

  { nome: "Club de Nuit Milestone", marca: "Armaf", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Derby Club House Gold", marca: "Armaf", tipo: "EDT", genero: "Masculino", categoria: "arabe" },
  { nome: "Tres Nuit", marca: "Armaf", tipo: "EDT", genero: "Masculino", categoria: "arabe" },
  { nome: "Opus Homme", marca: "Armaf", tipo: "EDT", genero: "Masculino", categoria: "arabe" },
  { nome: "Club de Nuit Undone", marca: "Armaf", tipo: "EDP", genero: "Masculino", categoria: "arabe" },
  { nome: "Club de Nuit Sillage", marca: "Armaf", tipo: "EDP", genero: "Unissex", categoria: "arabe" },

  { nome: "Amber Oud Exclusif Sport", marca: "Al Haramain", tipo: "Extrait", genero: "Unissex", categoria: "arabe" },
  { nome: "Junoon", marca: "Al Haramain", tipo: "EDP", genero: "Feminino", categoria: "arabe" },
  { nome: "Portfolio Neroli Canvas", marca: "Al Haramain", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "L'Aventure Blanche", marca: "Al Haramain", tipo: "EDP", genero: "Feminino", categoria: "arabe" },
  { nome: "L'Aventure Intense", marca: "Al Haramain", tipo: "EDP", genero: "Masculino", categoria: "arabe" },

  { nome: "Clive Dorris", marca: "Fragrance World", tipo: "EDP", genero: "Masculino", categoria: "arabe" },
  { nome: "Encode Blue", marca: "Fragrance World", tipo: "EDP", genero: "Masculino", categoria: "arabe" },
  { nome: "Intensive Oud", marca: "Fragrance World", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Baroque Oud", marca: "Fragrance World", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Apex", marca: "Fragrance World", tipo: "EDP", genero: "Masculino", categoria: "arabe" },

  { nome: "Grand Rouge", marca: "Paris Corner", tipo: "EDP", genero: "Feminino", categoria: "arabe" },
  { nome: "Emir Patchwork", marca: "Paris Corner", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Emir Voux Jasmine", marca: "Paris Corner", tipo: "EDP", genero: "Feminino", categoria: "arabe" },
  { nome: "Khair Midnight", marca: "Paris Corner", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Emir Campfire", marca: "Paris Corner", tipo: "EDP", genero: "Unissex", categoria: "arabe" },

  { nome: "Dirham", marca: "Ard Al Zaafaran", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Dirham Gold", marca: "Ard Al Zaafaran", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Shams Al Emarat", marca: "Ard Al Zaafaran", tipo: "EDP", genero: "Feminino", categoria: "arabe" },
  { nome: "Oud Sharqia", marca: "Ard Al Zaafaran", tipo: "EDP", genero: "Unissex", categoria: "arabe" },

  { nome: "Taraf", marca: "Zimaya", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Taraf Blue", marca: "Zimaya", tipo: "EDP", genero: "Masculino", categoria: "arabe" },
  { nome: "Taraf Gold", marca: "Zimaya", tipo: "EDP", genero: "Unissex", categoria: "arabe" },

  { nome: "Explorer", marca: "Al Wataniah", tipo: "EDP", genero: "Masculino", categoria: "arabe" },
  { nome: "Abyan", marca: "Al Wataniah", tipo: "EDP", genero: "Feminino", categoria: "arabe" },
  { nome: "Noor", marca: "Al Wataniah", tipo: "EDP", genero: "Feminino", categoria: "arabe" },
  { nome: "Majetic Gold", marca: "Al Wataniah", tipo: "EDP", genero: "Masculino", categoria: "arabe" },
  { nome: "Majestic Gold", marca: "Al Wataniah", tipo: "EDP", genero: "Masculino", categoria: "arabe" },

  // ==========================================
  // Bloco D — Contratipos que faltam (com inspiradoEm e marcaOriginal)
  // ==========================================
  { nome: "Ambre Infini", marca: "In The Box", tipo: "EDP", genero: "Unissex", categoria: "contratipo", inspiradoEm: "Amber Aoud", marcaOriginal: "Roja Parfums" },
  { nome: "Baron", marca: "In The Box", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Bleecker Street", marcaOriginal: "Bond No 9" },
  { nome: "Code Extreme", marca: "In The Box", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Armani Code Profumo", marcaOriginal: "Giorgio Armani" },
  { nome: "Conquiste", marca: "In The Box", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Layton", marcaOriginal: "Parfums de Marly" },
  { nome: "Elegance", marca: "In The Box", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Allure Homme Edition Blanche", marcaOriginal: "Chanel" },
  { nome: "Enigma", marca: "In The Box", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Interlude Man", marcaOriginal: "Amouage" },
  { nome: "Espartano", marca: "In The Box", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Pegasus", marcaOriginal: "Parfums de Marly" },
  { nome: "Guerreiro", marca: "In The Box", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Kouros", marcaOriginal: "Yves Saint Laurent" },
  { nome: "Hero", marca: "In The Box", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Invictus Aqua 2016", marcaOriginal: "Paco Rabanne" },
  { nome: "Imortal", marca: "In The Box", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "L'Immensite", marcaOriginal: "Louis Vuitton" },
  { nome: "L'Hombre", marca: "In The Box", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "L'Homme Ideal", marcaOriginal: "Guerlain" },
  { nome: "Lord", marca: "In The Box", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Green Irish Tweed", marcaOriginal: "Creed" },
  { nome: "Magnus", marca: "In The Box", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Grand Soir", marcaOriginal: "Maison Francis Kurkdjian" },
  { nome: "Noble", marca: "In The Box", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Naxos", marcaOriginal: "Xerjoff" },
  { nome: "Pallas", marca: "In The Box", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Reflection Man", marcaOriginal: "Amouage" },
  { nome: "Primus", marca: "In The Box", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Sauvage Elixir", marcaOriginal: "Dior" },
  { nome: "Ruler", marca: "In The Box", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Royal Oud", marcaOriginal: "Creed" },
  { nome: "Sovereign", marca: "In The Box", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Herod", marcaOriginal: "Parfums de Marly" },
  { nome: "Spectre", marca: "In The Box", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Spicebomb", marcaOriginal: "Viktor & Rolf" },
  { nome: "Supreme", marca: "In The Box", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Stronger With You", marcaOriginal: "Giorgio Armani" },
  { nome: "Target", marca: "In The Box", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Legend", marcaOriginal: "Montblanc" },
  { nome: "Vanguard", marca: "In The Box", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Avant-Garde", marcaOriginal: "Lanvin" },
  { nome: "Zeus", marca: "In The Box", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Aventus", marcaOriginal: "Creed" },
  { nome: "Amour", marca: "In The Box", tipo: "EDP", genero: "Feminino", categoria: "contratipo", inspiradoEm: "Love Don't Be Shy", marcaOriginal: "Kilian" },
  { nome: "Angelique", marca: "In The Box", tipo: "EDP", genero: "Feminino", categoria: "contratipo", inspiradoEm: "Angel", marcaOriginal: "Mugler" },
  { nome: "Aurora", marca: "In The Box", tipo: "EDP", genero: "Unissex", categoria: "contratipo", inspiradoEm: "Baccarat Rouge 540", marcaOriginal: "Maison Francis Kurkdjian" },
  { nome: "Beloved", marca: "In The Box", tipo: "EDP", genero: "Feminino", categoria: "contratipo", inspiradoEm: "Gabrielle", marcaOriginal: "Chanel" },
  { nome: "Cafe Gourmand", marca: "In The Box", tipo: "EDP", genero: "Unissex", categoria: "contratipo", inspiradoEm: "Intense Cafe", marcaOriginal: "Montale" },
  { nome: "Classy", marca: "In The Box", tipo: "EDP", genero: "Feminino", categoria: "contratipo", inspiradoEm: "Chance Eau Tendre", marcaOriginal: "Chanel" },
  { nome: "Diva", marca: "In The Box", tipo: "EDP", genero: "Feminino", categoria: "contratipo", inspiradoEm: "Coco Mademoiselle", marcaOriginal: "Chanel" },
  { nome: "Ethereal", marca: "In The Box", tipo: "EDP", genero: "Feminino", categoria: "contratipo", inspiradoEm: "Delina", marcaOriginal: "Parfums de Marly" },
  { nome: "Grace", marca: "In The Box", tipo: "EDP", genero: "Feminino", categoria: "contratipo", inspiradoEm: "Chloe EDP", marcaOriginal: "Chloe" },
  { nome: "Mon Amour", marca: "In The Box", tipo: "EDP", genero: "Feminino", categoria: "contratipo", inspiradoEm: "Mon Guerlain", marcaOriginal: "Guerlain" },
  { nome: "Sweet Girl", marca: "In The Box", tipo: "EDP", genero: "Feminino", categoria: "contratipo", inspiradoEm: "Good Girl", marcaOriginal: "Carolina Herrera" },

  { nome: "Viegas Sauvage", marca: "Maison Viegas", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Sauvage", marcaOriginal: "Dior" },
  { nome: "Viegas Bleu", marca: "Maison Viegas", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Bleu de Chanel", marcaOriginal: "Chanel" },
  { nome: "Viegas Aventis", marca: "Maison Viegas", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Aventus", marcaOriginal: "Creed" },
  { nome: "Viegas Code", marca: "Maison Viegas", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Armani Code", marcaOriginal: "Giorgio Armani" },
  { nome: "Viegas VIP", marca: "Maison Viegas", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "212 VIP Men", marcaOriginal: "Carolina Herrera" },
  { nome: "Viegas Invictus", marca: "Maison Viegas", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Invictus", marcaOriginal: "Paco Rabanne" },
  { nome: "Viegas L'Homme", marca: "Maison Viegas", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Prada L'Homme", marcaOriginal: "Prada" },
  { nome: "Viegas Eros", marca: "Maison Viegas", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Eros", marcaOriginal: "Versace" },
  { nome: "Viegas Terres", marca: "Maison Viegas", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Terre d'Hermes", marcaOriginal: "Hermes" },
  { nome: "Viegas Million", marca: "Maison Viegas", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "1 Million", marcaOriginal: "Paco Rabanne" },
  { nome: "Viegas Vida", marca: "Maison Viegas", tipo: "EDP", genero: "Feminino", categoria: "contratipo", inspiradoEm: "La Vie Est Belle", marcaOriginal: "Lancome" },
  { nome: "Viegas Good Girl", marca: "Maison Viegas", tipo: "EDP", genero: "Feminino", categoria: "contratipo", inspiradoEm: "Good Girl", marcaOriginal: "Carolina Herrera" },
  { nome: "Viegas Chloe", marca: "Maison Viegas", tipo: "EDP", genero: "Feminino", categoria: "contratipo", inspiradoEm: "Chloe EDP", marcaOriginal: "Chloe" },
  { nome: "Viegas Gabrielle", marca: "Maison Viegas", tipo: "EDP", genero: "Feminino", categoria: "contratipo", inspiradoEm: "Gabrielle", marcaOriginal: "Chanel" },
  { nome: "Viegas Coco", marca: "Maison Viegas", tipo: "EDP", genero: "Feminino", categoria: "contratipo", inspiradoEm: "Coco Mademoiselle", marcaOriginal: "Chanel" },

  { nome: "King", marca: "JA Essence Bar", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Aventus", marcaOriginal: "Creed" },
  { nome: "Savage", marca: "JA Essence Bar", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Sauvage", marcaOriginal: "Dior" },
  { nome: "VIP Black", marca: "JA Essence Bar", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "212 VIP Black", marcaOriginal: "Carolina Herrera" },
  { nome: "VIP Rose", marca: "JA Essence Bar", tipo: "EDP", genero: "Feminino", categoria: "contratipo", inspiradoEm: "212 VIP Rose", marcaOriginal: "Carolina Herrera" },
  { nome: "Code", marca: "JA Essence Bar", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Armani Code", marcaOriginal: "Giorgio Armani" },
  { nome: "L'Homme", marca: "JA Essence Bar", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Prada L'Homme", marcaOriginal: "Prada" },
  { nome: "Invictos", marca: "JA Essence Bar", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Invictus", marcaOriginal: "Paco Rabanne" },
  { nome: "Eros", marca: "JA Essence Bar", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Eros", marcaOriginal: "Versace" },
  { nome: "La Vida", marca: "JA Essence Bar", tipo: "EDP", genero: "Feminino", categoria: "contratipo", inspiradoEm: "La Vie Est Belle", marcaOriginal: "Lancome" },
  { nome: "Good Girl", marca: "JA Essence Bar", tipo: "EDP", genero: "Feminino", categoria: "contratipo", inspiradoEm: "Good Girl", marcaOriginal: "Carolina Herrera" },
  { nome: "Libre", marca: "JA Essence Bar", tipo: "EDP", genero: "Feminino", categoria: "contratipo", inspiradoEm: "Libre", marcaOriginal: "Yves Saint Laurent" },
  { nome: "Coco", marca: "JA Essence Bar", tipo: "EDP", genero: "Feminino", categoria: "contratipo", inspiradoEm: "Coco Mademoiselle", marcaOriginal: "Chanel" },
  { nome: "Delina", marca: "JA Essence Bar", tipo: "EDP", genero: "Feminino", categoria: "contratipo", inspiradoEm: "Delina", marcaOriginal: "Parfums de Marly" },
  { nome: "Bleu", marca: "JA Essence Bar", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Bleu de Chanel", marcaOriginal: "Chanel" },
  { nome: "One", marca: "JA Essence Bar", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "1 Million", marcaOriginal: "Paco Rabanne" },

  { nome: "Azza Savage", marca: "Azza Parfums", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Sauvage", marcaOriginal: "Dior" },
  { nome: "Azza Bleu", marca: "Azza Parfums", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Bleu de Chanel", marcaOriginal: "Chanel" },
  { nome: "Azza Aventus", marca: "Azza Parfums", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Aventus", marcaOriginal: "Creed" },
  { nome: "Azza Eros", marca: "Azza Parfums", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Eros", marcaOriginal: "Versace" },
  { nome: "Azza Invictus", marca: "Azza Parfums", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Invictus", marcaOriginal: "Paco Rabanne" },
  { nome: "Azza VIP Black", marca: "Azza Parfums", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "212 VIP Black", marcaOriginal: "Carolina Herrera" },
  { nome: "Azza Million", marca: "Azza Parfums", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "1 Million", marcaOriginal: "Paco Rabanne" },
  { nome: "Azza Code", marca: "Azza Parfums", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Armani Code", marcaOriginal: "Giorgio Armani" },
  { nome: "Azza La Vie", marca: "Azza Parfums", tipo: "EDP", genero: "Feminino", categoria: "contratipo", inspiradoEm: "La Vie Est Belle", marcaOriginal: "Lancome" },
  { nome: "Azza Good Girl", marca: "Azza Parfums", tipo: "EDP", genero: "Feminino", categoria: "contratipo", inspiradoEm: "Good Girl", marcaOriginal: "Carolina Herrera" },

  { nome: "Adventus", marca: "Nuancielo", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Aventus", marcaOriginal: "Creed" },
  { nome: "Savage", marca: "Nuancielo", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Sauvage", marcaOriginal: "Dior" },
  { nome: "Bleu", marca: "Nuancielo", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Bleu de Chanel", marcaOriginal: "Chanel" },
  { nome: "Armageddon", marca: "Nuancielo", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Terre d'Hermes", marcaOriginal: "Hermes" },
  { nome: "Meltemi", marca: "Nuancielo", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Ultra Male", marcaOriginal: "Jean Paul Gaultier" },
  { nome: "Dominus", marca: "Nuancielo", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Pegasus", marcaOriginal: "Parfums de Marly" },
  { nome: "Vibrant", marca: "Nuancielo", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Layton", marcaOriginal: "Parfums de Marly" },
  { nome: "Kharisma", marca: "Nuancielo", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Naxos", marcaOriginal: "Xerjoff" },
  { nome: "Fenix", marca: "Nuancielo", tipo: "EDP", genero: "Masculino", categoria: "contratipo", inspiradoEm: "Spicebomb Extreme", marcaOriginal: "Viktor & Rolf" },
  { nome: "Poli", marca: "Nuancielo", tipo: "EDP", genero: "Unissex", categoria: "contratipo", inspiradoEm: "Baccarat Rouge 540", marcaOriginal: "Maison Francis Kurkdjian" },
  { nome: "Delice", marca: "Nuancielo", tipo: "EDP", genero: "Feminino", categoria: "contratipo", inspiradoEm: "Delina", marcaOriginal: "Parfums de Marly" },
  { nome: "Belle", marca: "Nuancielo", tipo: "EDP", genero: "Feminino", categoria: "contratipo", inspiradoEm: "La Vie Est Belle", marcaOriginal: "Lancome" },

  // ==========================================
  // Bloco E — Nacionais faltando
  // ==========================================
  { nome: "Malbec Vert", marca: "O Boticário", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Malbec Absoluto", marca: "O Boticário", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Coffee Woman", marca: "O Boticário", tipo: "EDT", genero: "Feminino", categoria: "nacional" },
  { nome: "Nativa SPA Ameixa", marca: "O Boticário", tipo: "Desodorante Colônia", genero: "Feminino", categoria: "nacional" },
  { nome: "Cuide-Se Bem Nuvem", marca: "O Boticário", tipo: "Desodorante Colônia", genero: "Feminino", categoria: "nacional" },
  { nome: "Zaad Vision", marca: "O Boticário", tipo: "EDP", genero: "Masculino", categoria: "nacional" },
  { nome: "Zaad Arctic", marca: "O Boticário", tipo: "EDP", genero: "Masculino", categoria: "nacional" },
  { nome: "Arbo Ocean", marca: "O Boticário", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Egeo Dolce", marca: "O Boticário", tipo: "EDT", genero: "Feminino", categoria: "nacional" },
  { nome: "Egeo Choc Mint", marca: "O Boticário", tipo: "EDT", genero: "Unissex", categoria: "nacional" },
  { nome: "Lily Luminata", marca: "O Boticário", tipo: "EDP", genero: "Feminino", categoria: "nacional" },
  { nome: "Liz Flora", marca: "O Boticário", tipo: "EDT", genero: "Feminino", categoria: "nacional" },
  { nome: "Portinari", marca: "O Boticário", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Floratta Flores Secretas", marca: "O Boticário", tipo: "EDT", genero: "Feminino", categoria: "nacional" },
  { nome: "Glamour Secrets Black", marca: "O Boticário", tipo: "EDT", genero: "Feminino", categoria: "nacional" },
  { nome: "Linda", marca: "O Boticário", tipo: "EDT", genero: "Feminino", categoria: "nacional" },
  { nome: "Elysee", marca: "O Boticário", tipo: "EDP", genero: "Feminino", categoria: "nacional" },
  { nome: "Insensatez", marca: "O Boticário", tipo: "EDT", genero: "Unissex", categoria: "nacional" },
  { nome: "Cuide-Se Bem Baunilha", marca: "O Boticário", tipo: "Desodorante Colônia", genero: "Feminino", categoria: "nacional" },
  { nome: "Egeo Red", marca: "O Boticário", tipo: "EDT", genero: "Feminino", categoria: "nacional" },
  { nome: "Egeo Cherry Blast", marca: "O Boticário", tipo: "EDT", genero: "Unissex", categoria: "nacional" },
  { nome: "Malbec Flame", marca: "O Boticário", tipo: "EDT", genero: "Masculino", categoria: "nacional" },

  { nome: "Biografia Masculino", marca: "Natura", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Sr N", marca: "Natura", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Essencial Supreme Masculino", marca: "Natura", tipo: "EDP", genero: "Masculino", categoria: "nacional" },
  { nome: "Essencial Supreme Feminino", marca: "Natura", tipo: "EDP", genero: "Feminino", categoria: "nacional" },
  { nome: "Homem Sagaz", marca: "Natura", tipo: "EDP", genero: "Masculino", categoria: "nacional" },
  { nome: "Homem Dom", marca: "Natura", tipo: "EDP", genero: "Masculino", categoria: "nacional" },
  { nome: "Ilia Dual", marca: "Natura", tipo: "EDP", genero: "Feminino", categoria: "nacional" },
  { nome: "Luna Alegria", marca: "Natura", tipo: "Desodorante Colônia", genero: "Feminino", categoria: "nacional" },
  { nome: "Tododia Ameixa e Flor de Cerejeira", marca: "Natura", tipo: "Body Splash", genero: "Feminino", categoria: "nacional" },
  { nome: "Tododia Lima e Flor de Laranjeira", marca: "Natura", tipo: "Body Splash", genero: "Feminino", categoria: "nacional" },
  { nome: "Essencial Oud Masculino", marca: "Natura", tipo: "EDP", genero: "Masculino", categoria: "nacional" },
  { nome: "Essencial Oud Feminino", marca: "Natura", tipo: "EDP", genero: "Feminino", categoria: "nacional" },

  { nome: "Deluxe", marca: "Eudora", tipo: "EDP", genero: "Feminino", categoria: "nacional" },
  { nome: "Niina Secrets", marca: "Eudora", tipo: "Desodorante Colônia", genero: "Feminino", categoria: "nacional" },
  { nome: "Pulse Men", marca: "Eudora", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Eudora Soul", marca: "Eudora", tipo: "Desodorante Colônia", genero: "Feminino", categoria: "nacional" },
  { nome: "Diva", marca: "Eudora", tipo: "Desodorante Colônia", genero: "Feminino", categoria: "nacional" },
  { nome: "Siage", marca: "Eudora", tipo: "Desodorante Colônia", genero: "Feminino", categoria: "nacional" },
  { nome: "Instance Baunilha", marca: "Eudora", tipo: "Desodorante Colônia", genero: "Feminino", categoria: "nacional" },

  { nome: "Scapin 970", marca: "O.U.i", tipo: "EDP", genero: "Feminino", categoria: "nacional" },
  { nome: "Eclat d'Amour", marca: "O.U.i", tipo: "EDP", genero: "Feminino", categoria: "nacional" },
  { nome: "L'Amour-Esse 142", marca: "O.U.i", tipo: "EDP", genero: "Feminino", categoria: "nacional" },
  { nome: "Iconique 001", marca: "O.U.i", tipo: "EDP", genero: "Masculino", categoria: "nacional" },

  { nome: "Far Away", marca: "Avon", tipo: "EDP", genero: "Feminino", categoria: "nacional" },
  { nome: "Luck Him", marca: "Avon", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "300 KM/H Max Turbo", marca: "Avon", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Black Suede", marca: "Avon", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Segno", marca: "Avon", tipo: "EDP", genero: "Masculino", categoria: "nacional" },
  { nome: "Maxime", marca: "Avon", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Rare Pearls", marca: "Avon", tipo: "EDP", genero: "Feminino", categoria: "nacional" },

  { nome: "Patricia Abravanel", marca: "Jequiti", tipo: "Desodorante Colônia", genero: "Feminino", categoria: "nacional" },
  { nome: "Camelia", marca: "Jequiti", tipo: "Desodorante Colônia", genero: "Feminino", categoria: "nacional" },
  { nome: "Empire", marca: "Hinode", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Empire Gold", marca: "Hinode", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Empire Intense", marca: "Hinode", tipo: "EDT", genero: "Masculino", categoria: "nacional" },

  // ==========================================
  // Bloco F — Marcas designer faltantes
  // ==========================================
  { nome: "Shalimar EDP", marca: "Guerlain", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Mon Guerlain", marca: "Guerlain", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Habit Rouge", marca: "Guerlain", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "L'Homme Ideal EDT", marca: "Guerlain", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "L'Homme Ideal EDP", marca: "Guerlain", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Aqua Allegoria Mandarine Basilic", marca: "Guerlain", tipo: "EDT", genero: "Feminino", categoria: "importado-designer" },

  { nome: "Terre d'Hermes", marca: "Hermes", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Terre d'Hermes Parfum", marca: "Hermes", tipo: "Parfum", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Un Jardin Sur Le Nil", marca: "Hermes", tipo: "EDT", genero: "Unissex", categoria: "importado-designer" },
  { nome: "Twilly d'Hermes", marca: "Hermes", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Voyage d'Hermes", marca: "Hermes", tipo: "EDT", genero: "Unissex", categoria: "importado-designer" },
  { nome: "H24", marca: "Hermes", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },

  { nome: "Loewe 001 Man", marca: "Loewe", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Loewe 001 Woman", marca: "Loewe", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Solo Loewe", marca: "Loewe", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Loewe Aire", marca: "Loewe", tipo: "EDT", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Loewe 7", marca: "Loewe", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },

  { nome: "Bottega Veneta Pour Homme", marca: "Bottega Veneta", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Bottega Veneta Pour Homme Parfum", marca: "Bottega Veneta", tipo: "Parfum", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Bottega Veneta Illusione", marca: "Bottega Veneta", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },

  { nome: "Florabotanica", marca: "Balenciaga", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Balenciaga B.", marca: "Balenciaga", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Cristobal", marca: "Balenciaga", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },

  { nome: "Declaration", marca: "Cartier", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "L'Envol de Cartier", marca: "Cartier", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "La Panthere", marca: "Cartier", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Must de Cartier", marca: "Cartier", tipo: "EDT", genero: "Feminino", categoria: "importado-designer" },

  { nome: "Flower by Kenzo", marca: "Kenzo", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "L'Eau par Kenzo", marca: "Kenzo", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Kenzo Homme EDP", marca: "Kenzo", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Kenzo World", marca: "Kenzo", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },

  { nome: "Chloe EDP", marca: "Chloe", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Chloe Nomade", marca: "Chloe", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Chloe Love Story", marca: "Chloe", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },

  { nome: "Miu Miu L'Eau Bleue", marca: "Miu Miu", tipo: "EDP", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Miu Miu L'Eau Rosee", marca: "Miu Miu", tipo: "EDT", genero: "Feminino", categoria: "importado-designer" },

  { nome: "White Tea", marca: "Elizabeth Arden", tipo: "EDT", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Green Tea", marca: "Elizabeth Arden", tipo: "EDT", genero: "Feminino", categoria: "importado-designer" },
  { nome: "Red Door", marca: "Elizabeth Arden", tipo: "EDT", genero: "Feminino", categoria: "importado-designer" },

  { nome: "Cool Water Men", marca: "Davidoff", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Hot Water", marca: "Davidoff", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "The Game", marca: "Davidoff", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },

  { nome: "Only The Brave", marca: "Diesel", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Diesel Bad", marca: "Diesel", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Spirit of the Brave", marca: "Diesel", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" }
];

// Gerar candidatos adicionais dinamicamente para garantir volume
const extrasNacionais = [
  { nome: "Egeo Blue", marca: "O Boticário", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Egeo Vanilla Vibe", marca: "O Boticário", tipo: "EDT", genero: "Feminino", categoria: "nacional" },
  { nome: "Egeo Spicy Vibe", marca: "O Boticário", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Egeo Beat", marca: "O Boticário", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Egeo Hit", marca: "O Boticário", tipo: "EDT", genero: "Feminino", categoria: "nacional" },
  { nome: "Malbec Flame", marca: "O Boticário", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Malbec Gold", marca: "O Boticário", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Malbec Magnetic", marca: "O Boticário", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Malbec Black", marca: "O Boticário", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Malbec Bleau", marca: "O Boticário", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Arbo Forest", marca: "O Boticário", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Arbo Botanic", marca: "O Boticário", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Coffee Man Duo", marca: "O Boticário", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Coffee Man Seduction", marca: "O Boticário", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Coffee Woman Duo", marca: "O Boticário", tipo: "EDT", genero: "Feminino", categoria: "nacional" },
  { nome: "Coffee Woman Seduction", marca: "O Boticário", tipo: "EDT", genero: "Feminino", categoria: "nacional" },
  { nome: "Floratta Blue", marca: "O Boticário", tipo: "EDT", genero: "Feminino", categoria: "nacional" },
  { nome: "Floratta Red", marca: "O Boticário", tipo: "EDT", genero: "Feminino", categoria: "nacional" },
  { nome: "Floratta Gold", marca: "O Boticário", tipo: "EDT", genero: "Feminino", categoria: "nacional" },
  { nome: "Floratta Rose", marca: "O Boticário", tipo: "EDT", genero: "Feminino", categoria: "nacional" },
  { nome: "Lily Absolu", marca: "O Boticário", tipo: "EDP", genero: "Feminino", categoria: "nacional" },
  { nome: "Love Lily", marca: "O Boticário", tipo: "EDP", genero: "Feminino", categoria: "nacional" },
  { nome: "Uomini Moto Soul", marca: "O Boticário", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Zaad Go", marca: "O Boticário", tipo: "EDP", genero: "Masculino", categoria: "nacional" },
  { nome: "Zaad Santal", marca: "O Boticário", tipo: "EDP", genero: "Masculino", categoria: "nacional" },

  { nome: "Essencial Oud Masculino", marca: "Natura", tipo: "EDP", genero: "Masculino", categoria: "nacional" },
  { nome: "Essencial Oud Feminino", marca: "Natura", tipo: "EDP", genero: "Feminino", categoria: "nacional" },
  { nome: "Essencial Exclusivo Masculino", marca: "Natura", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Essencial Mirra Masculino", marca: "Natura", tipo: "EDP", genero: "Masculino", categoria: "nacional" },
  { nome: "Homem Essence", marca: "Natura", tipo: "EDP", genero: "Masculino", categoria: "nacional" },
  { nome: "Homem Cor.Agio", marca: "Natura", tipo: "EDP", genero: "Masculino", categoria: "nacional" },
  { nome: "Ilia Secreto", marca: "Natura", tipo: "EDP", genero: "Feminino", categoria: "nacional" },
  { nome: "Luna Radiante", marca: "Natura", tipo: "Desodorante Colônia", genero: "Feminino", categoria: "nacional" },
  { nome: "Luna Absolute", marca: "Natura", tipo: "Desodorante Colônia", genero: "Feminino", categoria: "nacional" },
  { nome: "Kaiak Oceano Masculino", marca: "Natura", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Kaiak Vital Masculino", marca: "Natura", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Kaiak Aero Masculino", marca: "Natura", tipo: "EDT", genero: "Masculino", categoria: "nacional" },

  { nome: "Club 6 Class", marca: "Eudora", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Club 6 Exclusive", marca: "Eudora", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Club 6 Voyage", marca: "Eudora", tipo: "EDT", genero: "Masculino", categoria: "nacional" },
  { nome: "Imensi", marca: "Eudora", tipo: "EDP", genero: "Feminino", categoria: "nacional" },
  { nome: "Imensi Alive", marca: "Eudora", tipo: "EDP", genero: "Feminino", categoria: "nacional" }
];

const extrasArabes = [
  { nome: "Bade'e Al Oud Oud for Glory", marca: "Lattafa", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Sheikh Al Shuyukh Luxe Edition", marca: "Lattafa", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Velvet Oud", marca: "Lattafa", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Hayaati", marca: "Lattafa", tipo: "EDP", genero: "Masculino", categoria: "arabe" },
  { nome: "Hayaati Al Maleky", marca: "Lattafa", tipo: "EDP", genero: "Masculino", categoria: "arabe" },
  { nome: "Qaed Al Fursan", marca: "Lattafa", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Ameer Al Oudh Intense Oud", marca: "Lattafa", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Oud Mood", marca: "Lattafa", tipo: "EDP", genero: "Unissex", categoria: "arabe" },

  { nome: "Kismet Moscow", marca: "Maison Alhambra", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Kismet Magic", marca: "Maison Alhambra", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Tobacco Touch", marca: "Maison Alhambra", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Woody Oud", marca: "Maison Alhambra", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Fabulo Intense", marca: "Maison Alhambra", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Lovely Cherie", marca: "Maison Alhambra", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Jorge di Profondo", marca: "Maison Alhambra", tipo: "EDP", genero: "Masculino", categoria: "arabe" },
  { nome: "Victorioso Myth", marca: "Maison Alhambra", tipo: "EDP", genero: "Masculino", categoria: "arabe" },

  { nome: "Supremacy Not Only Intense", marca: "Afnan", tipo: "Extrait", genero: "Masculino", categoria: "arabe" },
  { nome: "Supremacy In Heaven", marca: "Afnan", tipo: "EDP", genero: "Masculino", categoria: "arabe" },
  { nome: "Supremacy Incense", marca: "Afnan", tipo: "EDP", genero: "Masculino", categoria: "arabe" },
  { nome: "Modest Une", marca: "Afnan", tipo: "EDP", genero: "Masculino", categoria: "arabe" },

  { nome: "Club de Nuit Intense Man EDT", marca: "Armaf", tipo: "EDT", genero: "Masculino", categoria: "arabe" },
  { nome: "Club de Nuit Intense Man EDP", marca: "Armaf", tipo: "EDP", genero: "Masculino", categoria: "arabe" },
  { nome: "Club de Nuit Intense Man Limited Edition", marca: "Armaf", tipo: "Parfum", genero: "Masculino", categoria: "arabe" },
  { nome: "Club de Nuit Intense Woman", marca: "Armaf", tipo: "EDP", genero: "Feminino", categoria: "arabe" },
  { nome: "Club de Nuit Untold", marca: "Armaf", tipo: "EDP", genero: "Unissex", categoria: "arabe" },
  { nome: "Club de Nuit Niche Oud", marca: "Armaf", tipo: "EDP", genero: "Unissex", categoria: "arabe" }
];

const extrasNicho = [
  { nome: "Layton", marca: "Parfums de Marly", tipo: "EDP", genero: "Masculino", categoria: "nicho" },
  { nome: "Herod", marca: "Parfums de Marly", tipo: "EDP", genero: "Masculino", categoria: "nicho" },
  { nome: "Pegasus", marca: "Parfums de Marly", tipo: "EDP", genero: "Masculino", categoria: "nicho" },
  { nome: "Percival", marca: "Parfums de Marly", tipo: "EDP", genero: "Masculino", categoria: "nicho" },
  { nome: "Carlisle", marca: "Parfums de Marly", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Greenley", marca: "Parfums de Marly", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Sedley", marca: "Parfums de Marly", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Haltane", marca: "Parfums de Marly", tipo: "EDP", genero: "Masculino", categoria: "nicho" },
  { nome: "Layton Exclusif", marca: "Parfums de Marly", tipo: "EDP", genero: "Masculino", categoria: "nicho" },
  { nome: "Delina Exclusif", marca: "Parfums de Marly", tipo: "EDP", genero: "Feminino", categoria: "nicho" },

  { nome: "Baccarat Rouge 540", marca: "Maison Francis Kurkdjian", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Baccarat Rouge 540 Extrait", marca: "Maison Francis Kurkdjian", tipo: "Extrait", genero: "Unissex", categoria: "nicho" },
  { nome: "Grand Soir", marca: "Maison Francis Kurkdjian", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Gentle Fluidity Silver", marca: "Maison Francis Kurkdjian", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Gentle Fluidity Gold", marca: "Maison Francis Kurkdjian", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Amyris Homme", marca: "Maison Francis Kurkdjian", tipo: "EDT", genero: "Masculino", categoria: "nicho" },
  { nome: "Oud Satin Mood", marca: "Maison Francis Kurkdjian", tipo: "EDP", genero: "Unissex", categoria: "nicho" },

  { nome: "Erba Pura", marca: "Xerjoff", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Alexandria II", marca: "Xerjoff", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Renaissance", marca: "Xerjoff", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "40 Knots", marca: "Xerjoff", tipo: "EDP", genero: "Unissex", categoria: "nicho" },
  { nome: "Mefisto", marca: "Xerjoff", tipo: "EDP", genero: "Masculino", categoria: "nicho" },
  { nome: "Lira", marca: "Xerjoff", tipo: "EDP", genero: "Feminino", categoria: "nicho" },
  { nome: "Italica", marca: "Xerjoff", tipo: "EDP", genero: "Unissex", categoria: "nicho" }
];

const extrasDesigner = [
  { nome: "Sauvage EDP", marca: "Dior", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Sauvage EDT", marca: "Dior", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Fahrenheit EDT", marca: "Dior", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Bleu de Chanel EDP", marca: "Chanel", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Bleu de Chanel EDT", marca: "Chanel", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "1 Million EDT", marca: "Paco Rabanne", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Invictus EDT", marca: "Paco Rabanne", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Acqua di Gio Pour Homme", marca: "Giorgio Armani", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Acqua di Gio Profondo", marca: "Giorgio Armani", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Acqua di Gio Parfum", marca: "Giorgio Armani", tipo: "Parfum", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Armani Code EDT", marca: "Giorgio Armani", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Armani Code EDP", marca: "Giorgio Armani", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Armani Code Parfum", marca: "Giorgio Armani", tipo: "Parfum", genero: "Masculino", categoria: "importado-designer" },
  { nome: "La Nuit de L'Homme EDT", marca: "Yves Saint Laurent", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "L'Homme EDT", marca: "Yves Saint Laurent", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Y EDP", marca: "Yves Saint Laurent", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Y EDT", marca: "Yves Saint Laurent", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Le Male EDT", marca: "Jean Paul Gaultier", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Ultra Male", marca: "Jean Paul Gaultier", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Le Male Le Parfum", marca: "Jean Paul Gaultier", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Le Beau EDT", marca: "Jean Paul Gaultier", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Le Beau Le Parfum", marca: "Jean Paul Gaultier", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Scandal Pour Homme EDT", marca: "Jean Paul Gaultier", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Prada L'Homme", marca: "Prada", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Luna Rossa Carbon", marca: "Prada", tipo: "EDT", genero: "Masculino", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Luna Rossa Black", marca: "Prada", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Explorer", marca: "Montblanc", tipo: "EDP", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Legend", marca: "Montblanc", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" },
  { nome: "Legend Spirit", marca: "Montblanc", tipo: "EDT", genero: "Masculino", categoria: "importado-designer" }
];

const todosCandidatos = [
  ...candidatosRaw,
  ...extrasNacionais,
  ...extrasArabes,
  ...extrasNicho,
  ...extrasDesigner
];

console.log(`Total de candidatos mapeados: ${todosCandidatos.length}`);

// Filtra para remover duplicatas internas dos candidatos e os que já existem no expandido
const finalList = [];
const processedCandidateKeys = new Set();

for (const p of todosCandidatos) {
  const slug = `${slugify(p.nome)}-${slugify(p.marca)}`;
  const matchKey = `${slugify(p.nome)}|${slugify(p.marca)}`;

  if (existingSlugs.has(slug) || existingNames.has(matchKey)) {
    continue;
  }
  if (processedCandidateKeys.has(matchKey)) {
    continue;
  }

  processedCandidateKeys.add(matchKey);

  // Formata o perfume para o formato básico do expandido
  finalList.push({
    id: slug,
    nome: p.nome,
    marca: p.marca,
    tipo: p.tipo || "EDP",
    genero: p.genero || "Masculino",
    inspiradoEm: p.inspiradoEm || null,
    marcaOriginal: p.marcaOriginal || null,
    familia: "",
    notas: {
      topo: [],
      coracao: [],
      fundo: []
    },
    preco_brl: 0,
    categoria: p.categoria,
    disponivel: true,
    linkCompra: "",
    acordes: [],
    estacao: { verao: "", primavera: "", outono: "", inverno: "" },
    ocasiao: { casual: "", profissional: "", noite: "", esporte: "", romantico: "" },
    comoCheira: "",
    paraQuem: "",
    quandoUsar: "",
    comoSeComporta: ""
  });

  if (finalList.length === 500) {
    break;
  }
}

console.log(`Perfumes filtrados e selecionados para o Lote 2: ${finalList.length}`);

if (finalList.length < 500) {
  console.error(`ERRO: Conseguimos apenas ${finalList.length} perfumes novos. Mapeie mais candidatos.`);
  process.exit(1);
}

// Salva o lote2 em scripts/perfumes-lote2.json
fs.writeFileSync(LOTE2_PATH, JSON.stringify(finalList, null, 2), 'utf8');
console.log(`Salvo: ${LOTE2_PATH}`);

// Adiciona os 500 ao expandido e salva
const novoExpandido = [...expandido, ...finalList];
fs.writeFileSync(EXPANDIDO_PATH, JSON.stringify(novoExpandido, null, 2), 'utf8');
console.log(`Salvo ${finalList.length} perfumes novos em ${EXPANDIDO_PATH}. Novo total: ${novoExpandido.length}`);
