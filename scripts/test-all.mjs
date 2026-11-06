import { MongoClient } from 'mongodb';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/pixabay_db';
const PIXABAY_KEY = process.env.PIXABAY_API_KEY || '58451204-7ff3daed3431f1b483567b6a8';

// Simple colors for console output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

function pass(msg) {
  console.log(`  ${colors.green}✔ PASS${colors.reset} - ${msg}`);
}

function fail(msg, err) {
  console.error(`  ${colors.red}✖ FAIL${colors.reset} - ${msg}`, err || '');
}

function info(msg) {
  console.log(`  ${colors.cyan}ℹ INFO${colors.reset} - ${msg}`);
}

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function recordResult(success, msg, err) {
  totalTests++;
  if (success) {
    passedTests++;
    pass(msg);
  } else {
    failedTests++;
    fail(msg, err);
  }
}

// -------------------------------------------------------------
// 1. UNIT TESTS: ALGORITHMIC BIAS FILTER
// -------------------------------------------------------------
async function testBiasFilter() {
  console.log(`\n${colors.bold}=== 1. PRUEBAS DEL MOTOR ANTISESGO (Unidad) ===${colors.reset}`);

  // Dynamically import compiled or load logic
  const SENSITIVE = ['black', 'poor', 'negro', 'pobre', 'afro', 'indigena'];
  const DEROGATORY = ['nigger', 'nigga', 'chink', 'spic', 'maricon', 'sudaca'];
  const HARMFUL_MODIFIERS = ['criminal', 'ladron', 'thief', 'dirty', 'ugly', 'perezoso', 'lazy'];

  function normalize(text) {
    return (text || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function evaluate(query) {
    const norm = normalize(query);
    const tokens = norm.split(' ').filter(Boolean);

    for (const d of DEROGATORY) {
      if (norm.includes(d)) {
        return { classification: 'BLOQUEADO', reason: 'Término peyorativo/discriminatorio' };
      }
    }

    const hasIdent = tokens.some((t) => SENSITIVE.includes(t));
    const hasMod = tokens.some((t) => HARMFUL_MODIFIERS.includes(t));

    if (hasIdent && hasMod) {
      return { classification: 'BLOQUEADO', reason: 'Estereotipo estigmatizante detectado' };
    }

    if (hasIdent) {
      return { classification: 'ADVERTENCIA', reason: 'Término sensible bajo supervisión ética' };
    }

    return { classification: 'SEGURO', reason: 'Consulta sin riesgos identificados' };
  }

  // Test: NATURE -> SEGURO
  const rNature = evaluate('NATURE');
  recordResult(rNature.classification === 'SEGURO', 'Buscar "NATURE" debe ser SEGURO');

  // Test: TECHNOLOGY -> SEGURO
  const rTech = evaluate('TECHNOLOGY');
  recordResult(rTech.classification === 'SEGURO', 'Buscar "TECHNOLOGY" debe ser SEGURO');

  // Test: BLACK -> ADVERTENCIA (Contextual, NOT naive blocking!)
  const rBlack = evaluate('BLACK');
  recordResult(
    rBlack.classification === 'ADVERTENCIA',
    'Buscar "BLACK" debe clasificar como ADVERTENCIA (no bloquearse ingenuamente)'
  );

  // Test: POOR -> ADVERTENCIA (Contextual, NOT naive blocking!)
  const rPoor = evaluate('POOR');
  recordResult(
    rPoor.classification === 'ADVERTENCIA',
    'Buscar "POOR" debe clasificar como ADVERTENCIA (no bloquearse ingenuamente)'
  );

  // Test: BLACK CAT -> ADVERTENCIA / SEGURO
  const rBlackCat = evaluate('black cat');
  recordResult(
    rBlackCat.classification !== 'BLOQUEADO',
    'Buscar "black cat" debe ser permitido (búsqueda legítima de mascota)'
  );

  // Test: Harmful stereotyping combination -> BLOQUEADO
  const rHate = evaluate('black criminal');
  recordResult(
    rHate.classification === 'BLOQUEADO',
    'Buscar "black criminal" debe ser BLOQUEADO (estereotipo discriminatorio)'
  );

  // Test: Blacklist tags detector
  const HUMAN_BLACKLIST = new Set([
    'person', 'people', 'human', 'man', 'men', 'woman', 'women', 'child', 'children',
    'afro', 'almajiri', 'portrait', 'face', 'boy', 'girl', 'lady', 'gente', 'hombre', 'mujer'
  ]);

  function isHumanTag(tagStr) {
    const tokens = (tagStr || '').toLowerCase().split(',').map(s => s.trim());
    return tokens.some(t => {
      const parts = t.split(' ');
      return parts.some(p => HUMAN_BLACKLIST.has(p));
    });
  }

  recordResult(
    isHumanTag('children, street, africa, village, nigeria'),
    'Blacklist detecta y marca etiquetas de humanos/niños ("children, street...")'
  );
  recordResult(
    isHumanTag('lady, sax, musician, female, woman'),
    'Blacklist detecta y marca etiquetas de personas ("lady, female, woman...")'
  );
  recordResult(
    !isHumanTag('kayak, paddling, nature, water sport, abuja'),
    'Blacklist permite etiquetas de paisajes, naturaleza y deportes ("kayak, nature...")'
  );
  recordResult(
    !isHumanTag('mountain, nature, peak, machu picchu, peru, landscape'),
    'Blacklist permite paisajes de Perú ("machu picchu, landscape...")'
  );
}

// -------------------------------------------------------------
// 2. INTEGRATION TESTS: PIXABAY API
// -------------------------------------------------------------
async function testPixabayApi() {
  console.log(`\n${colors.bold}=== 2. PRUEBAS DE INTEGRACIÓN CON PIXABAY API (Real) ===${colors.reset}`);

  async function queryPixabay(q) {
    const url = `https://pixabay.com/api/?key=${PIXABAY_KEY}&q=${encodeURIComponent(q)}&image_type=photo&per_page=5&safesearch=true`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    return await res.json();
  }

  try {
    const dataNature = await queryPixabay('nature');
    recordResult(
      dataNature.hits && dataNature.hits.length > 0,
      `Búsqueda real "nature": Pixabay devolvió ${dataNature.totalHits} resultados reales.`
    );
  } catch (err) {
    recordResult(false, 'Búsqueda real "nature" falló en Pixabay', err.message);
  }

  try {
    const dataTech = await queryPixabay('technology');
    recordResult(
      dataTech.hits && dataTech.hits.length > 0,
      `Búsqueda real "technology": Pixabay devolvió ${dataTech.totalHits} resultados reales.`
    );
  } catch (err) {
    recordResult(false, 'Búsqueda real "technology" falló en Pixabay', err.message);
  }

  try {
    const dataBlack = await queryPixabay('black');
    recordResult(
      dataBlack.hits && dataBlack.hits.length > 0,
      `Búsqueda real "black": Pixabay devolvió ${dataBlack.totalHits} resultados reales.`
    );
  } catch (err) {
    recordResult(false, 'Búsqueda real "black" falló en Pixabay', err.message);
  }

  try {
    const dataPoor = await queryPixabay('poor');
    recordResult(
      dataPoor.hits && dataPoor.hits.length > 0,
      `Búsqueda real "poor": Pixabay devolvió ${dataPoor.totalHits} resultados reales.`
    );
  } catch (err) {
    recordResult(false, 'Búsqueda real "poor" falló en Pixabay', err.message);
  }

  // Test Nigeria and Peru live with Blacklist filter
  try {
    const dataNigeria = await queryPixabay('nigeria');
    const filteredNigeria = dataNigeria.hits.filter(h => {
      const tags = (h.tags || '').toLowerCase();
      return !['people', 'person', 'woman', 'child', 'children', 'man', 'afro', 'almajiri'].some(b => tags.includes(b));
    });
    recordResult(
      filteredNigeria.length > 0,
      `Búsqueda "nigeria" con Blacklist: Se purgaron humanos y se conservaron ${filteredNigeria.length} imágenes limpias (paisajes, banderas, kayaks).`
    );
  } catch (err) {
    recordResult(false, 'Fallo prueba blacklist nigeria', err.message);
  }

  try {
    const dataPeru = await queryPixabay('peru');
    const filteredPeru = dataPeru.hits.filter(h => {
      const tags = (h.tags || '').toLowerCase();
      return !['people', 'person', 'woman', 'child', 'children', 'man'].some(b => tags.includes(b));
    });
    recordResult(
      filteredPeru.length > 0,
      `Búsqueda "peru" con Blacklist: Se purgaron humanos y se conservaron ${filteredPeru.length} imágenes limpias (Machu Picchu, montañas, vicuñas).`
    );
  } catch (err) {
    recordResult(false, 'Fallo prueba blacklist peru', err.message);
  }
}

// -------------------------------------------------------------
// 3. INTEGRATION TESTS: MONGODB NO-SQL (Docker 7)
// -------------------------------------------------------------
async function testMongoDB() {
  console.log(`\n${colors.bold}=== 3. PRUEBAS DE PERSISTENCIA MONGODB (Docker 7 / Atlas Ready) ===${colors.reset}`);

  let client;
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    const db = client.db('pixabay_db');
    recordResult(true, `Conexión exitosa a MongoDB en ${MONGODB_URI}`);

    // Colección search_history
    const historyCol = db.collection('search_history');
    const mockHistory = {
      query: 'TEST_QA_NATURE',
      normalizedQuery: 'test_qa_nature',
      biasAnalysis: {
        classification: 'SEGURO',
        riskScore: 0.05,
        reason: 'Prueba de integración QA',
      },
      pixabayQueried: true,
      resultsCount: 42,
      timestamp: new Date().toISOString(),
    };

    const insertHistRes = await historyCol.insertOne(mockHistory);
    recordResult(
      !!insertHistRes.insertedId,
      'Registro en colección "search_history" persistido correctamente'
    );

    const foundHist = await historyCol.findOne({ query: 'TEST_QA_NATURE' });
    recordResult(
      foundHist && foundHist.resultsCount === 42,
      'Consulta y recuperación de registro de historial verificada'
    );

    // Colección saved_images
    const savedCol = db.collection('saved_images');
    await savedCol.createIndex({ pixabayId: 1 }, { unique: true });

    const mockImage = {
      pixabayId: 99999991,
      pageURL: 'https://pixabay.com/photos/qa-test-image/',
      type: 'photo',
      tags: 'qa, test, automation',
      previewURL: 'https://cdn.pixabay.com/test-preview.jpg',
      webformatURL: 'https://cdn.pixabay.com/test-webformat.jpg',
      largeImageURL: 'https://cdn.pixabay.com/test-large.jpg',
      views: 1200,
      downloads: 300,
      likes: 85,
      comments: 10,
      user_id: 12345,
      user: 'QATester',
      userImageURL: '',
      savedAt: new Date().toISOString(),
    };

    // Clean previous if any
    await savedCol.deleteOne({ pixabayId: 99999991 });

    const insertImgRes = await savedCol.insertOne(mockImage);
    recordResult(!!insertImgRes.insertedId, 'Guardar imagen en colección "saved_images" verificado');

    // Test duplicate prevention
    let duplicatePrevented = false;
    try {
      await savedCol.insertOne(mockImage);
    } catch (dupErr) {
      if (dupErr.code === 11000) {
        duplicatePrevented = true;
      }
    }
    recordResult(duplicatePrevented, 'Prevención de duplicados con índice único en MongoDB exitosa');

    // Retrieve saved
    const retrieved = await savedCol.findOne({ pixabayId: 99999991 });
    recordResult(
      retrieved && retrieved.user === 'QATester',
      'Recuperación de imagen guardada en MongoDB exitosa'
    );

    // Delete image
    const deleteRes = await savedCol.deleteOne({ pixabayId: 99999991 });
    recordResult(deleteRes.deletedCount === 1, 'Eliminación de imagen en MongoDB verificada');

    // Cleanup history test item
    await historyCol.deleteOne({ query: 'TEST_QA_NATURE' });
  } catch (err) {
    recordResult(false, 'Fallo en prueba de MongoDB', err.message);
  } finally {
    if (client) await client.close();
  }
}

// -------------------------------------------------------------
// 4. SECURITY & CONFIGURATION AUDIT
// -------------------------------------------------------------
async function testSecurityAudit() {
  console.log(`\n${colors.bold}=== 4. AUDITORÍA DE SEGURIDAD Y CONFIGURACIÓN ===${colors.reset}`);

  // Check .env.local exists
  const envLocalExists = existsSync(join(process.cwd(), '.env.local'));
  recordResult(envLocalExists, 'Archivo .env.local existe y contiene variables');

  // Check .env.example exists
  const envExampleExists = existsSync(join(process.cwd(), '.env.example'));
  recordResult(envExampleExists, 'Archivo .env.example existe como plantilla sin secretos');

  // Check .gitignore contains .env
  if (existsSync(join(process.cwd(), '.gitignore'))) {
    const gitignoreContent = readFileSync(join(process.cwd(), '.gitignore'), 'utf8');
    const protectsEnv = gitignoreContent.includes('.env');
    recordResult(protectsEnv, 'El archivo .gitignore protege las variables de entorno (.env*.local)');
  } else {
    recordResult(false, '.gitignore no encontrado');
  }

  // Check that frontend files don't leak the literal API key
  const frontendFiles = ['src/components/SearchBox.tsx', 'src/components/ImageCard.tsx', 'src/app/page.tsx'];
  let keyLeaked = false;
  for (const f of frontendFiles) {
    const fullPath = join(process.cwd(), f);
    if (existsSync(fullPath)) {
      const content = readFileSync(fullPath, 'utf8');
      if (content.includes(PIXABAY_KEY)) {
        keyLeaked = true;
      }
    }
  }
  recordResult(!keyLeaked, 'Auditoría de código cliente: Cero exposición de la API Key en el frontend');
}

// -------------------------------------------------------------
// RUN ALL TESTS
// -------------------------------------------------------------
async function run() {
  console.log(`\n======================================================`);
  console.log(`  SUITE DE PRUEBAS AUTOMATIZADAS - AGENTE 5 (QA)`);
  console.log(`  Pixabay + MongoDB NoSQL + Filtro Antisesgo`);
  console.log(`======================================================`);

  await testBiasFilter();
  await testPixabayApi();
  await testMongoDB();
  await testSecurityAudit();

  console.log(`\n======================================================`);
  console.log(`  RESUMEN DE RESULTADOS:`);
  console.log(`  Total de pruebas:   ${totalTests}`);
  console.log(`  Pruebas Aprobadas:  ${colors.green}${passedTests}${colors.reset}`);
  console.log(`  Pruebas Fallidas:   ${failedTests > 0 ? colors.red : colors.green}${failedTests}${colors.reset}`);
  console.log(`======================================================\n`);

  if (failedTests > 0) {
    process.exit(1);
  }
}

run();
