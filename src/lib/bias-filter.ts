import { BiasAnalysisResult, BiasClassification, PixabayImage } from '@/types';

/**
 * Normalizes text: lowercases, removes diacritics/accents, strips special characters.
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s]/g, ' ') // replace non-alphanumeric with spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenizes normalized text into array of clean words.
 */
export function tokenize(text: string): string[] {
  const norm = normalizeText(text);
  if (!norm) return [];
  return norm.split(' ').filter(Boolean);
}

// Sensitive terms relating to race, socio-economic status, gender, or vulnerable groups
// These should NOT be blocked by default! They require contextual analysis.
const SENSITIVE_IDENTITY_TERMS = new Set([
  'black',
  'negro',
  'negra',
  'afro',
  'afroamericano',
  'afrodescendiente',
  'poor',
  'pobre',
  'pobreza',
  'indigena',
  'native',
  'indigenous',
  'white',
  'blanco',
  'blanca',
  'gypsy',
  'gitano',
  'gitana',
  'refugee',
  'refugiado',
  'inmigrante',
  'migrant',
  'gay',
  'lesbian',
  'trans',
  'queer',
  'disability',
  'discapacitado',
  'slum',
  'tugurio',
  'favela',
  'ghetto',
]);

// Explicitly discriminatory, offensive, hate speech, or derogatory terms
const HATE_AND_DEROGATORY_TERMS = new Set([
  'nigger',
  'nigga',
  'chink',
  'spic',
  'kike',
  'wetback',
  'faggot',
  'marica',
  'maricon',
  'sudaca',
  'negrata',
  'escoria',
  'subhuman',
  'subhumano',
  'inferior race',
  'raza inferior',
  'mono',
  'monkey',
  'macaco',
  'delincuente racial',
  'limpieza etnica',
  'white power',
  'supremacismo',
  'odio',
]);

// Negative / Stereotyping modifiers that, when combined with sensitive identity terms, indicate algorithmic harm
const HARMFUL_MODIFIERS = new Set([
  'criminal',
  'ladron',
  'thief',
  'dirty',
  'sucio',
  'ugly',
  'feo',
  'lazy',
  'perezoso',
  'flojo',
  'violent',
  'violento',
  'stupid',
  'estupido',
  'salvaje',
  'savage',
  'dangerous',
  'peligroso',
  'rata',
  'rat',
  'terrorist',
  'terrorista',
  'corrupt',
  'corrupto',
]);

// Benign contextual keywords that clearly indicate legitimate, aesthetic, documentary or artistic searches
const BENIGN_CONTEXT_KEYWORDS = new Set([
  'cat',
  'gato',
  'dog',
  'perro',
  'car',
  'auto',
  'carro',
  'dress',
  'vestido',
  'suit',
  'traje',
  'coffee',
  'cafe',
  'night',
  'noche',
  'background',
  'fondo',
  'hair',
  'cabello',
  'pelo',
  'eyes',
  'ojos',
  'metal',
  'leather',
  'cuero',
  'wall',
  'pared',
  'panther',
  'pantera',
  'bird',
  'pajaro',
  'art',
  'arte',
  'culture',
  'cultura',
  'history',
  'historia',
  'documentary',
  'documental',
  'portrait',
  'retrato',
  'family',
  'familia',
  'community',
  'comunidad',
  'education',
  'educacion',
  'study',
  'estudio',
  'work',
  'trabajo',
  'solidarity',
  'solidaridad',
  'help',
  'ayuda',
  'nature',
  'naturaleza',
  'technology',
  'tecnologia',
]);

/**
 * Analyzes a query to detect algorithmic bias, hate speech, or sensitive representations.
 * Categorizes the query into SEGURO, ADVERTENCIA, or BLOQUEADO.
 */
export function analyzeBias(query: string): BiasAnalysisResult {
  const trimmed = (query || '').trim();
  if (!trimmed) {
    return {
      classification: 'SEGURO',
      riskScore: 0.0,
      reason: 'Consulta vacía.',
      matchedCategories: [],
      flags: {
        containsSensitiveIdentity: false,
        containsDerogatoryTerms: false,
        containsStereotypeContext: false,
        isLegitimateContext: true,
      },
      suggestedAction: 'Ingresa un término de búsqueda.',
    };
  }

  const normalized = normalizeText(trimmed);
  const tokens = tokenize(trimmed);

  // 1. Check for explicit hate or derogatory expressions (BLOQUEADO)
  for (const derogatory of HATE_AND_DEROGATORY_TERMS) {
    if (normalized.includes(derogatory)) {
      return {
        classification: 'BLOQUEADO',
        riskScore: 1.0,
        reason: `La búsqueda contiene términos ofensivos o discriminatorios no permitidos ('${derogatory}').`,
        matchedCategories: ['DISCRIMINACIÓN_EXPLÍCITA', 'DISCURSO_DE_ODIO'],
        flags: {
          containsSensitiveIdentity: true,
          containsDerogatoryTerms: true,
          containsStereotypeContext: true,
          isLegitimateContext: false,
        },
        suggestedAction: 'Búsqueda denegada. Modifica la consulta respetando los principios de inclusión y diversidad.',
      };
    }
  }

  // 2. Identify sensitive identity words and harmful modifiers
  const detectedIdentities: string[] = [];
  const detectedModifiers: string[] = [];
  const detectedBenign: string[] = [];

  for (const token of tokens) {
    if (SENSITIVE_IDENTITY_TERMS.has(token)) {
      detectedIdentities.push(token);
    }
    if (HARMFUL_MODIFIERS.has(token)) {
      detectedModifiers.push(token);
    }
    if (BENIGN_CONTEXT_KEYWORDS.has(token)) {
      detectedBenign.push(token);
    }
  }

  // 3. Evaluate toxic combinations: Identity + Harmful modifier (Stereotype / Bigotry) -> BLOQUEADO
  if (detectedIdentities.length > 0 && detectedModifiers.length > 0) {
    return {
      classification: 'BLOQUEADO',
      riskScore: 0.95,
      reason: `La combinación de términos ('${detectedIdentities.join(', ')}') con calificativos peyorativos ('${detectedModifiers.join(', ')}') refuerza estereotipos estigmatizantes y discriminación algorítmica.`,
      matchedCategories: ['ESTEREOTIPO_DAÑINO', 'SESGO_ESTIGMATIZANTE'],
      flags: {
        containsSensitiveIdentity: true,
        containsDerogatoryTerms: false,
        containsStereotypeContext: true,
        isLegitimateContext: false,
      },
      suggestedAction: 'Evita asociar identidades sensibles con calificativos denigrantes o estereotipos negativos.',
    };
  }

  // 4. Sensitive identity detected WITHOUT harmful modifiers -> ADVERTENCIA
  // (Legitimate search with contextual advice, NOT blocked)
  if (detectedIdentities.length > 0) {
    const isBenignContext = detectedBenign.length > 0 || tokens.length > 1;
    const term = detectedIdentities.join(', ').toUpperCase();

    return {
      classification: 'ADVERTENCIA',
      riskScore: isBenignContext ? 0.35 : 0.5,
      reason: `Término sensible identificado (${term}). El sistema activa el monitoreo ético para evitar la sobrerrepresentación de estereotipos y garantizar una representación diversa y respetuosa.`,
      matchedCategories: ['TÉRMINO_SENSIBLE_PROTEGIDO', 'MONITOREO_REPRESENTACIÓN'],
      flags: {
        containsSensitiveIdentity: true,
        containsDerogatoryTerms: false,
        containsStereotypeContext: false,
        isLegitimateContext: true,
      },
      suggestedAction: `Búsqueda permitida con supervisión algorítmica. Puedes refinar la consulta agregando contexto cultural, artístico o descriptivo.`,
    };
  }

  // 5. Completely safe / neutral query (e.g. "nature", "technology", "beach", "laptop") -> SEGURO
  return {
    classification: 'SEGURO',
    riskScore: 0.05,
    reason: 'Consulta validada sin riesgos identificados de sesgo algorítmico o discriminación.',
    matchedCategories: ['CONSULTA_ESTÁNDAR'],
    flags: {
      containsSensitiveIdentity: false,
      containsDerogatoryTerms: false,
      containsStereotypeContext: false,
      isLegitimateContext: true,
    },
    suggestedAction: 'Búsqueda segura aprobada.',
  };
}

/**
 * BLACKLIST DE PERSONAS, ROSTROS Y TÉRMINOS DEMOGRÁFICOS HUMANOS
 * Diseñada para mitigar sesgos algorítmicos geográficos y étnicos
 * (ej. si buscas "nigeria" o "peru", previene la sobrerrepresentación de humanos/estereotipos,
 * priorizando paisajes, arquitectura, cultura, arte, geografía, flora y fauna).
 */
export const HUMAN_TAGS_BLACKLIST = new Set([
  // Términos genéricos humanos
  'person',
  'persons',
  'people',
  'human',
  'humans',
  'individual',
  'individuals',
  'persona',
  'personas',
  'humano',
  'humanos',
  'gente',
  'poblacion',
  'poblador',
  'pobladores',
  'habitante',
  'habitantes',
  'almajiri',

  // Género y edades
  'man',
  'men',
  'male',
  'guy',
  'gentleman',
  'gentlemen',
  'hombre',
  'hombres',
  'varon',
  'varones',
  'caballero',
  'woman',
  'women',
  'female',
  'lady',
  'ladies',
  'girl',
  'girls',
  'mujer',
  'mujeres',
  'dama',
  'damas',
  'senora',
  'señora',
  'chica',
  'chicas',
  'child',
  'children',
  'kid',
  'kids',
  'boy',
  'boys',
  'baby',
  'babies',
  'toddler',
  'infant',
  'nino',
  'niño',
  'ninos',
  'niños',
  'nina',
  'niña',
  'ninas',
  'niñas',
  'bebe',
  'bebé',
  'bebes',
  'bebés',
  'infante',
  'joven',
  'jovenes',
  'jóvenes',
  'chico',
  'chicos',
  'teen',
  'teenager',
  'adult',
  'adults',
  'elderly',
  'old man',
  'old woman',
  'senior',
  'anciano',
  'ancianos',
  'anciana',
  'ancianas',
  'abuelo',
  'abuela',

  // Rostros, poses y retratos
  'face',
  'faces',
  'portrait',
  'portraits',
  'headshot',
  'selfie',
  'model',
  'models',
  'posing',
  'rostro',
  'rostros',
  'cara',
  'caras',
  'retrato',
  'retratos',
  'modelo',
  'modelos',
  'posando',
  'crowd',
  'crowds',
  'pedestrians',
  'tourists',
  'multitud',
  'peatones',
  'turistas',

  // Representaciones étnicas y demográficas de personas
  'afro',
  'african american',
  'black person',
  'black man',
  'black woman',
  'indigenous person',
  'native person',
  'tribe',
  'tribal',
  'villager',
  'villagers',
  'campesino',
  'campesina',
  'campesinos',
  'worker',
  'workers',
  'trabajador',
  'trabajadores',
  'peddler',
  'vendor',
  'vendors',
  'vendedor',
  'musician',
  'performer',
  'saxophonist',
  'player',
]);

/**
 * Comprueba si una cadena de etiquetas contiene algún término de la lista negra de personas.
 */
export function containsHumanBlacklistTags(tagsString: string): { containsHuman: boolean; matchedTags: string[] } {
  if (!tagsString) return { containsHuman: false, matchedTags: [] };

  const rawTags = tagsString.split(',').map((t) => normalizeText(t)).filter(Boolean);
  const matched: string[] = [];

  for (const tag of rawTags) {
    if (HUMAN_TAGS_BLACKLIST.has(tag)) {
      matched.push(tag);
      continue;
    }
    const tagTokens = tag.split(' ');
    for (const token of tagTokens) {
      if (HUMAN_TAGS_BLACKLIST.has(token)) {
        matched.push(token);
        break;
      }
    }
  }

  return {
    containsHuman: matched.length > 0,
    matchedTags: Array.from(new Set(matched)),
  };
}

/**
 * Filtra un conjunto de imágenes de Pixabay eliminando aquellas que contengan personas o rostros
 * identificados en sus etiquetas por la lista negra antisesgo.
 */
export function filterImagesByHumanBlacklist(images: PixabayImage[]): {
  cleanImages: PixabayImage[];
  filteredOutCount: number;
  matchedTagsSample: string[];
} {
  const cleanImages: PixabayImage[] = [];
  const allMatchedTags: string[] = [];
  let filteredOutCount = 0;

  for (const img of images) {
    const check = containsHumanBlacklistTags(img.tags);
    if (check.containsHuman) {
      filteredOutCount++;
      for (const t of check.matchedTags) {
        if (!allMatchedTags.includes(t)) {
          allMatchedTags.push(t);
        }
      }
    } else {
      cleanImages.push(img);
    }
  }

  return {
    cleanImages,
    filteredOutCount,
    matchedTagsSample: allMatchedTags.slice(0, 10),
  };
}

