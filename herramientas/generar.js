/* Genera casos.js. Uso: node herramientas/generar.js
   Cada caso se construye al azar (semilla fija) y solo se acepta si:
   - tiene EXACTAMENTE una solución por fuerza bruta (sin usar la regla del culpable)
   - el solver lógico lo resuelve paso a paso (sin adivinar)
   - el culpable queda a solas con la víctima */
const fs = require('fs');
const path = require('path');
const K = require('../motor.js');

function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
let rnd = rng(1);
const azar = (n) => Math.floor(rnd() * n);
const elige = (a) => a[azar(a.length)];
const baraja = (a) => { a = [...a]; for (let i = a.length - 1; i > 0; i--) { const j = azar(i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- Caso 1: hecho a mano ---------- */
const CASO1 = {
  id: 'kanto-01', tema: 'kanto', numero: 1, titulo: 'La siesta más larga', lugar: 'Laboratorio del Profesor · Pueblo Paleta', dificultad: 1, size: 6,
  rooms: ['AAABBB', 'AAABBB', 'CCDDEE', 'CCDDEE', 'CCFFFF', 'CCFFFF'],
  salas: {
    A: { nombre: 'Laboratorio', en: 'en el Laboratorio', piso: 'lab' }, B: { nombre: 'Biblioteca', en: 'en la Biblioteca', piso: 'biblio' },
    C: { nombre: 'Jardín', en: 'en el Jardín', piso: 'jardin' }, D: { nombre: 'Dormitorio', en: 'en el Dormitorio', piso: 'descanso' },
    E: { nombre: 'Cocina', en: 'en la Cocina', piso: 'cocina' }, F: { nombre: 'Estanque', en: 'en el Estanque', piso: 'arena' },
  },
  objs: [[0, 0, 'maquina'], [1, 1, 'colchoneta'], [1, 2, 'pc'], [0, 3, 'estante'], [0, 4, 'estante'], [0, 5, 'estante'], [1, 5, 'mesa'], [3, 0, 'arbol'], [5, 1, 'arbol'],
    [2, 2, 'colchoneta'], [2, 5, 'mesa'], [3, 4, 'nevera'], [4, 5, 'roca'], [4, 4, 'agua'], [5, 3, 'agua'], [5, 4, 'agua'], [5, 5, 'agua']].map(([r, c, t]) => ({ r, c, t })),
  personajes: [
    { id: 'snorlax', victima: true, pista: { tipo: 'sobre', obj: 'colchoneta' }, texto: 'Lo encontraron K.O. tendido <b>sobre una colchoneta</b>.' },
    { id: 'pikachu', pista: { tipo: 'junto', obj: 'maquina' }, texto: 'Recargaba energía justo al lado <b>de la máquina de curación</b>.' },
    { id: 'meowth', pista: { tipo: 'sala', sala: 'B' }, texto: 'Husmeaba <b>en la Biblioteca</b> buscando monedas perdidas.' },
    { id: 'squirtle', pista: { tipo: 'sobre', obj: 'agua' }, texto: 'Chapoteaba <b>dentro del agua</b>.' },
    { id: 'charmander', pista: { tipo: 'junto', obj: 'arbol' }, texto: 'Tostaba bayas justo al lado <b>de un árbol de bayas</b>.' },
    { id: 'bulbasaur', pista: { tipo: 'acompanado' } },
  ],
  historia: 'Hora de la siesta en el laboratorio. Cuando el Profesor volvió con el té, encontró a <b>Snorlax fuera de combate</b>… y ni el más dormilón de Kanto duerme <i>así</i>. Seis Pokémon rondaban el lugar. Cada uno jura tener coartada.',
  movil: 'Snorlax se había zampado, una por una, todas las bayas que Bulbasaur cuidaba en el jardín. Un Somnífero bien dosificado… y un Látigo Cepa de yapa.',
  culpable: 'bulbasaur',
};

/* ---------- Casos 2–10: especificación ---------- */
const S = (nombre, en, piso, bloq, pis = {}) => ({ nombre, en, piso, bloq, pis });
const SPECS = [
  { numero: 1, size: 6, tier: 1, sondeos: 0, dificultad: 1, titulo: 'La siesta más larga', lugar: 'Laboratorio del Profesor · Pueblo Paleta',
    elenco: ['snorlax', 'pikachu', 'bulbasaur', 'charmander', 'rattata', 'oak'], culpable: 'bulbasaur',
    salas: [S('Laboratorio', 'en el Laboratorio', 'lab', ['maquina', 'pc', 'mesa'], { alfombra: 1 }), S('Biblioteca', 'en la Biblioteca', 'biblio', ['estante', 'mesa']),
      S('Jardín', 'en el Jardín', 'jardin', ['arbol', 'roca'], { hierba: 2 }), S('Dormitorio', 'en el Dormitorio', 'descanso', ['planta', 'estante'], { colchoneta: 2 }),
      S('Cocina', 'en la Cocina', 'cocina', ['nevera', 'mesa']), S('Estanque', 'en el Estanque', 'arena', ['roca'], { agua: 'mitad' })],
    historia: 'Hora de la siesta en el laboratorio. Cuando el Profesor Oak volvió con el té, encontró a <b>Snorlax fuera de combate</b>… y ni el más dormilón de Kanto duerme <i>así</i>. Todos juran tener coartada. Incluido el Profesor.',
    movil: 'Snorlax se había zampado, una por una, todas las bayas que Bulbasaur cuidaba en el jardín. Un Somnífero bien dosificado… y un Látigo Cepa de yapa.' },
  { numero: 2, size: 6, tier: 1, sondeos: 0, dificultad: 1, titulo: 'Canción de cuna', lugar: 'Centro Pokémon · Ciudad Verde',
    elenco: ['jigglypuff', 'psyduck', 'chansey', 'meowth', 'eevee', 'growlithe'], culpable: 'psyduck',
    salas: [S('Recepción', 'en la Recepción', 'lab', ['maquina', 'pc', 'planta'], { alfombra: 1 }), S('Sala de curación', 'en la Sala de curación', 'descanso', ['maquina', 'planta'], { colchoneta: 2 }),
      S('Tienda', 'en la Tienda', 'biblio', ['estante', 'caja']), S('Cafetería', 'en la Cafetería', 'cocina', ['mesa', 'nevera']),
      S('Patio', 'en el Patio', 'jardin', ['arbol', 'roca'], { hierba: 2 }), S('Bodega', 'en la Bodega', 'piedra', ['caja', 'barril'])],
    historia: 'La enfermera apagó las luces un minuto. Al encenderlas, <b>Jigglypuff estaba K.O.</b> y con el micrófono todavía en la mano. Por una vez, la que se quedó dormida fue ella.',
    movil: 'A Psyduck le estallaba la cabeza con tanta canción. Soltó una Confusión sin querer… o eso dice él.' },
  { numero: 3, size: 6, tier: 1, sondeos: 1, dificultad: 2, titulo: 'Eco en la caverna', lugar: 'Monte Moon',
    elenco: ['geodude', 'cubone', 'zubat', 'sandshrew', 'diglett', 'brock'], culpable: 'cubone',
    salas: [S('Entrada', 'en la Entrada', 'jardin', ['arbol', 'roca'], { hierba: 2 }), S('Galería', 'en la Galería', 'piedra', ['estatua', 'roca']),
      S('Lago', 'en el Lago', 'arena', ['roca'], { agua: 'mitad' }), S('Campamento', 'en el Campamento', 'biblio', ['caja', 'mesa'], { colchoneta: 2 }),
      S('Túnel', 'en el Túnel', 'torre', ['roca', 'barril']), S('Cámara lunar', 'en la Cámara lunar', 'hielo', ['estatua', 'roca'], { alfombra: 1 })],
    historia: 'Un golpe seco retumbó por todo el Monte Moon. Cuando el polvo bajó, <b>Geodude estaba K.O.</b> en el suelo de la cueva. Y eso que es una roca.',
    movil: 'Cubone practicaba su Huesomerang. El hueso volvió… pero pasando antes por la cabeza de Geodude.' },
  { numero: 4, size: 7, tier: 2, sondeos: 2, dificultad: 2, titulo: 'Chapuzón sospechoso', lugar: 'Gimnasio de Ciudad Celeste',
    elenco: ['psyduck', 'ditto', 'misty', 'staryu', 'horsea', 'krabby', 'squirtle'], culpable: 'ditto',
    salas: [S('Piscina', 'en la Piscina', 'arena', ['roca'], { agua: 'mitad' }), S('Vestuario', 'en el Vestuario', 'lab', ['estante', 'planta'], { alfombra: 1 }),
      S('Gradas', 'en las Gradas', 'biblio', ['caja', 'mesa']), S('Oficina', 'en la Oficina', 'descanso', ['pc', 'estante', 'planta'], { alfombra: 1 }),
      S('Trofeos', 'en la Sala de trofeos', 'casino', ['estatua', 'estante']), S('Jardín acuático', 'en el Jardín acuático', 'jardin', ['arbol', 'planta'], { agua: 2, hierba: 1 }),
      S('Bodega', 'en la Bodega', 'piedra', ['caja', 'barril'])],
    historia: 'Entrenamiento libre en el gimnasio. Alguien gritó, alguien salpicó, y <b>Psyduck apareció K.O.</b> con cara de no entender nada. O sea, su cara de siempre.',
    movil: 'Ditto se transformó en Psyduck para hacerle una broma. Psyduck se vio a sí mismo, se confundió… y se noqueó solo del susto. Técnicamente, fue Ditto.' },
  { numero: 5, size: 7, tier: 2, sondeos: 3, dificultad: 3, titulo: 'Motín a bordo', lugar: 'S.S. Anne · Ciudad Carmín',
    elenco: ['meowth', 'eevee', 'ash', 'pidgey', 'krabby', 'seel', 'rattata'], culpable: 'eevee',
    salas: [S('Cubierta', 'en la Cubierta', 'biblio', ['barril', 'caja']), S('Camarote', 'en el Camarote', 'casino', ['estante', 'mesa'], { colchoneta: 1, alfombra: 1 }),
      S('Comedor', 'en el Comedor', 'descanso', ['mesa', 'planta'], { alfombra: 1 }), S('Cocina', 'en la Cocina', 'cocina', ['nevera', 'mesa']),
      S('Máquinas', 'en la Sala de máquinas', 'metal', ['maquina', 'pc', 'barril']), S('Piscina', 'en la Piscina', 'arena', ['planta'], { agua: 'mitad' }),
      S('Bodega', 'en la Bodega', 'piedra', ['caja', 'barril'])],
    historia: 'El S.S. Anne zarpaba al atardecer cuando sonó la alarma: <b>Meowth yacía K.O.</b> junto a un saco de monedas desparramadas. Nadie baja del barco hasta aclarar esto.',
    movil: 'Meowth le había "tomado prestado" el cascabel de la suerte a Eevee. Un Derribo bien puesto arregló el malentendido.' },
  { numero: 6, size: 7, tier: 2, sondeos: 4, dificultad: 3, titulo: 'Susurros en la torre', lugar: 'Torre Pokémon · Pueblo Lavanda',
    elenco: ['cubone', 'jigglypuff', 'gastly', 'zubat', 'vulpix', 'abra', 'ditto'], culpable: 'jigglypuff',
    salas: [S('Vestíbulo', 'en el Vestíbulo', 'piedra', ['estatua', 'planta'], { alfombra: 1 }), S('Lápidas', 'en la Sala de lápidas', 'torre', ['lapida']),
      S('Altar', 'en el Altar', 'casino', ['estatua', 'lapida'], { alfombra: 2 }), S('Escalera', 'en la Escalera', 'biblio', ['caja', 'barril']),
      S('Mirador', 'en el Mirador', 'hielo', ['estatua', 'planta']), S('Cripta', 'en la Cripta', 'torre', ['lapida', 'roca']),
      S('Jardín', 'en el Jardín', 'jardin', ['arbol', 'planta'], { hierba: 2 })],
    historia: 'Medianoche en Pueblo Lavanda. Entre la niebla y las lápidas, <b>Cubone apareció K.O.</b> abrazado a su hueso. Todos miran a Gastly… demasiado fácil, ¿no?',
    movil: 'Jigglypuff solo quería público para su concierto nocturno. Cubone fue el único que se quedó hasta el final… muy a su pesar.' },
  { numero: 7, size: 8, tier: 3, sondeos: 5, dificultad: 4, titulo: 'La casa siempre gana', lugar: 'Casino Rocket · Ciudad Azulona',
    elenco: ['voltorb', 'slowpoke', 'meowth', 'jessie', 'james', 'koffing', 'abra', 'growlithe'], culpable: 'slowpoke',
    salas: [S('Tragamonedas', 'en el Salón de tragamonedas', 'casino', ['traga'], { alfombra: 1 }), S('Barra', 'en la Barra', 'biblio', ['barril', 'mesa', 'nevera']),
      S('Sala VIP', 'en la Sala VIP', 'descanso', ['mesa', 'planta', 'estatua'], { alfombra: 2 }), S('Bóveda', 'en la Bóveda', 'metal', ['caja', 'pc']),
      S('Escenario', 'en el Escenario', 'torre', ['estatua', 'planta'], { alfombra: 1 }), S('Guardarropa', 'en el Guardarropa', 'lab', ['estante', 'caja']),
      S('Oficina', 'en la Oficina', 'cocina', ['pc', 'estante', 'mesa']), S('Sótano', 'en el Sótano', 'piedra', ['caja', 'barril', 'maquina'])],
    historia: 'Las luces del casino parpadearon y la música se cortó. <b>Voltorb estaba K.O.</b> y, milagrosamente, sin explotar. Entre los presentes, dos caras conocidas del Team Rocket. Demasiado obvio… ¿o no?',
    movil: 'Slowpoke confundió a Voltorb con el premio mayor y le dio un Cabezazo… hace tres horas. Recién ahora se está enterando.' },
  { numero: 8, size: 8, tier: 3, sondeos: 7, dificultad: 4, titulo: 'Safari sin retorno', lugar: 'Zona Safari · Ciudad Fucsia',
    elenco: ['oddish', 'diglett', 'pidgey', 'caterpie', 'sandshrew', 'mankey', 'vulpix', 'brock'], culpable: 'diglett',
    salas: [S('Entrada', 'en la Entrada', 'biblio', ['mesa', 'pc', 'caja']), S('Pradera', 'en la Pradera', 'jardin', ['arbol', 'roca'], { hierba: 3 }),
      S('Pantano', 'en el Pantano', 'torre', ['roca', 'arbol'], { agua: 3 }), S('Bosque', 'en el Bosque', 'jardin', ['arbol'], { hierba: 2 }),
      S('Lago', 'en el Lago', 'arena', ['roca'], { agua: 'mitad' }), S('Refugio', 'en el Refugio', 'descanso', ['mesa', 'nevera'], { colchoneta: 2 }),
      S('Colina', 'en la Colina', 'piedra', ['roca', 'estatua']), S('Huerto', 'en el Huerto', 'cocina', ['arbol', 'barril', 'planta'], { hierba: 1 })],
    historia: 'Quedaban dos Safari Balls y cinco minutos de tiempo cuando <b>Oddish apareció K.O.</b>, con las hojas todas despeinadas. Nadie vio nada. Como siempre.',
    movil: 'Diglett salió a la superficie justo debajo de Oddish. No fue un ataque: fue pésima puntería. Pero el chichón es real.' },
  { numero: 9, size: 9, tier: 3, sondeos: 9, dificultad: 5, titulo: 'Corte de energía', lugar: 'Silph S.A. · Ciudad Azafrán',
    elenco: ['eevee', 'pikachu', 'magnemite', 'voltorb', 'koffing', 'jessie', 'james', 'ash', 'dratini'], culpable: 'pikachu',
    salas: [S('Recepción', 'en la Recepción', 'lab', ['planta', 'pc', 'estatua'], { alfombra: 1 }), S('Laboratorio', 'en el Laboratorio', 'metal', ['maquina', 'pc', 'mesa'], { alfombra: 1 }),
      S('Servidores', 'en la Sala de servidores', 'torre', ['pc', 'maquina'], { alfombra: 1 }), S('Presidencia', 'en la Presidencia', 'casino', ['mesa', 'estante', 'estatua'], { alfombra: 2 }),
      S('Cafetería', 'en la Cafetería', 'cocina', ['mesa', 'nevera', 'planta'], { alfombra: 1 }), S('Almacén', 'en el Almacén', 'piedra', ['caja', 'barril'], { colchoneta: 1 }),
      S('Teletransporte', 'en la Sala de teletransporte', 'hielo', ['maquina'], { alfombra: 2 }), S('Archivo', 'en el Archivo', 'biblio', ['estante', 'caja'], { alfombra: 1 }),
      S('Azotea', 'en la Azotea', 'jardin', ['planta', 'arbol'], { hierba: 2, agua: 1 })],
    historia: 'Apagón total en el edificio de Silph. Cuando volvió la luz, <b>Eevee estaba K.O.</b> y con el pelaje erizado como un cepillo. Nueve pisos de sospechosos.',
    movil: 'Pikachu solo quería cargar el celular del Profesor. Calculó mal el voltaje, dejó a oscuras el edificio… y a Eevee, de paso.' },
  { numero: 10, size: 9, tier: 3, sondeos: 12, dificultad: 5, titulo: 'La revancha', lugar: 'Liga Pokémon · Meseta Añil',
    elenco: ['pikachu', 'snorlax', 'ash', 'misty', 'bulbasaur', 'gengar', 'charmander', 'dratini', 'mew'], culpable: 'snorlax',
    salas: [S('Sala de hielo', 'en la Sala de hielo', 'hielo', ['roca', 'estatua'], { agua: 2 }), S('Sala de lucha', 'en la Sala de lucha', 'piedra', ['roca', 'barril'], { colchoneta: 2 }),
      S('Sala fantasma', 'en la Sala fantasma', 'torre', ['lapida', 'estatua']), S('Sala dragón', 'en la Sala dragón', 'casino', ['estatua', 'roca'], { alfombra: 2 }),
      S('Salón de la Fama', 'en el Salón de la Fama', 'descanso', ['estatua', 'pc', 'maquina'], { alfombra: 1 }), S('Vestíbulo', 'en el Vestíbulo', 'lab', ['planta', 'pc', 'maquina']),
      S('Tienda', 'en la Tienda', 'biblio', ['estante', 'caja']), S('Enfermería', 'en la Enfermería', 'cocina', ['maquina', 'nevera'], { colchoneta: 2 }),
      S('Jardín', 'en el Jardín', 'jardin', ['arbol', 'planta'], { hierba: 2, agua: 2 })],
    historia: 'Final de la Liga Pokémon. A minutos de la ceremonia, <b>Pikachu apareció K.O.</b> y aplastado como un panqueque. El caso más difícil de tu carrera… y huele a asunto pendiente.',
    movil: '¿Recuerdas el caso 1? Snorlax nunca olvidó aquella siesta. Venía a cobrársela a Bulbasaur… pero se dejó caer sobre el Pokémon equivocado.' },
];

/* ---------- Generación ---------- */
const LET = 'ABCDEFGHIJ';
function genRooms(n, k) {
  for (let intento = 0; intento < 400; intento++) {
    const g = Array.from({ length: n }, () => Array(n).fill(-1));
    const tam = Array(k).fill(0);
    const semillas = baraja(Array.from({ length: n * n }, (_, i) => i)).slice(0, k);
    semillas.forEach((s, i) => { g[Math.floor(s / n)][s % n] = i; tam[i] = 1; });
    let quedan = n * n - k, guard = 0;
    const vec = (r, c) => [[r - 1, c], [r + 1, c], [r, c - 1], [r, c + 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < n && b < n);
    while (quedan > 0 && guard++ < 5000) {
      const i = baraja([...Array(k).keys()]).sort((a, b) => tam[a] - tam[b])[azar(2)];
      const front = [];
      for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (g[r][c] === -1) {
        const m = vec(r, c).filter(([a, b]) => g[a][b] === i).length;
        if (m) front.push([r, c, m]);
      }
      if (!front.length) continue;
      const max = Math.max(...front.map((f) => f[2]));
      const [r, c] = elige(front.filter((f) => f[2] === max || rnd() < 0.25));
      g[r][c] = i; tam[i]++; quedan--;
    }
    if (quedan) continue;
    const media = (n * n) / k;
    if (Math.min(...tam) < Math.max(3, Math.floor(media * 0.55)) || Math.max(...tam) > media * 1.7) continue;
    return g.map((f) => f.map((i) => LET[i]).join(''));
  }
  throw new Error('no pude generar habitaciones');
}

function construirBase(spec) {
  const n = spec.size, rooms = genRooms(n, spec.salas.length);
  const orden = baraja(spec.salas), salas = {}, objs = [];
  orden.forEach((s, i) => { salas[LET[i]] = { nombre: s.nombre, en: s.en, piso: s.piso }; });
  orden.forEach((s, i) => {
    const celdas = [];
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (rooms[r][c] === LET[i]) celdas.push([r, c]);
    const mez = baraja(celdas);
    const nb = Math.max(1, Math.round(celdas.length * (0.2 + rnd() * 0.14)));
    for (let j = 0; j < nb; j++) { const [r, c] = mez.pop(); objs.push({ r, c, t: elige(s.bloq) }); }
    for (const [t, cant] of Object.entries(s.pis)) {
      const q = cant === 'mitad' ? Math.ceil(mez.length * 0.6) : cant;
      for (let j = 0; j < q && mez.length > 1; j++) { const [r, c] = mez.pop(); objs.push({ r, c, t }); }
    }
  });
  return { rooms, salas, objs };
}

function solucionAzar(caso, spec) {
  const n = caso.size, v = spec.elenco[0], cu = spec.culpable;
  const L = baraja(K.libres(caso));
  for (const [r1, c1] of L) for (const [r2, c2] of L) {
    if (r1 === r2 || c1 === c2 || caso.rooms[r1][c1] !== caso.rooms[r2][c2]) continue;
    const salaV = caso.rooms[r1][c1], pos = { [v]: [r1, c1], [cu]: [r2, c2] };
    const resto = spec.elenco.filter((x) => x !== v && x !== cu);
    const F = new Set([r1, r2]), C = new Set([c1, c2]);
    const ok = (function rec(i) {
      if (i === resto.length) return true;
      for (const [r, c] of baraja(L)) {
        if (F.has(r) || C.has(c) || caso.rooms[r][c] === salaV) continue;
        pos[resto[i]] = [r, c]; F.add(r); C.add(c);
        if (rec(i + 1)) return true;
        F.delete(r); C.delete(c); delete pos[resto[i]];
      }
      return false;
    })(0);
    if (ok) return pos;
    if (rnd() < 0.3) return null;
  }
  return null;
}

const PESOS = {
  1: { sala: 3, sobre: 4, junto: 4, todas: 1.5, grupo: 1.5, salaO: 1.5, combo: 1, linea: 0.4 },
  2: { sala: 1.5, sobre: 2, junto: 3, todas: 0.8, grupo: 2, salaO: 2.5, mismaSala: 1.5, cardinal: 2, combo: 1.5, diagonal: 1.5, linea: 0.5 },
  3: { sala: 0.5, sobre: 1, junto: 2, todas: 0.5, grupo: 2, salaO: 2.5, mismaSala: 2, cardinal: 3, diagonal: 4, combo: 2, linea: 0.6 },
};
function candidatas(caso, spec, sol, id) {
  const W = PESOS[spec.tier], [r, c] = sol[id], sala = caso.rooms[r][c], out = [];
  const v = spec.elenco[0], esV = id === v, esC = id === spec.culpable;
  const add = (clase, pista) => { if (W[clase]) out.push({ w: W[clase], clase, pista }); };
  add('sala', { tipo: 'sala', sala });
  const ob = K.objAt(caso, r, c); if (ob) add('sobre', { tipo: 'sobre', obj: ob.t });
  const junto = [...new Set(caso.objs.filter((o) => Math.abs(o.r - r) + Math.abs(o.c - c) === 1 && caso.rooms[o.r][o.c] === sala).map((o) => o.t))];
  for (const t of junto) { add('junto', { tipo: 'junto', obj: t }); add('todas', { tipo: 'todas', de: [{ tipo: 'sala', sala }, { tipo: 'junto', obj: t }] }); }
  const otras = Object.keys(caso.salas).filter((s) => s !== sala);
  for (const o2 of baraja(otras).slice(0, 3)) {
    const dos = [sala, o2].sort();
    add('salaO', { tipo: 'salaO', salas: dos });
    for (const t of junto) add('combo', { tipo: 'todas', de: [{ tipo: 'salaO', salas: dos }, { tipo: 'junto', obj: t }] });
  }
  if (esV) return out;
  const enSala = spec.elenco.filter((x) => x !== id && caso.rooms[sol[x][0]][sol[x][1]] === sala);
  if (!enSala.length) add('grupo', { tipo: 'solo' });
  else if (!esC || spec.tier === 1) add('grupo', { tipo: 'acompanado' });
  for (const y of spec.elenco) {
    if (y === id || y === v) continue;
    const [yr, yc] = sol[y], conV = (esC && y === v);
    if (!conV && enSala.includes(y)) add('mismaSala', { tipo: 'mismaSala', con: y });
    if (!conV && Math.abs(yr - r) === 1 && Math.abs(yc - c) === 1) add('diagonal', { tipo: 'diagonal', con: y });
    out.push(...[['norte', r < yr], ['sur', r > yr], ['oeste', c < yc], ['este', c > yc]].filter((x) => x[1] && W.cardinal).map(([t]) => ({ w: W.cardinal / 2, clase: 'cardinal', pista: { tipo: t, con: y } })));
  }
  add('linea', { tipo: 'fila', n: r }); add('linea', { tipo: 'columna', n: c });
  // fuera las coartadas que regalan la casilla exacta
  const L = K.libres(caso);
  return out.filter((x) => L.filter((rc) => K.partes(x.pista).every((q) => !K.esUnaria(q) || K.evalPista(caso, q, id, { [id]: rc }))).length >= 2);
}
function sortea(lista) {
  const clases = [...new Set(lista.map((x) => x.clase))];
  const tot = clases.reduce((s, k) => s + lista.find((x) => x.clase === k).w, 0);
  let t = rnd() * tot, clase = clases[0];
  for (const k of clases) { t -= lista.find((x) => x.clase === k).w; if (t <= 0) { clase = k; break; } }
  return elige(lista.filter((x) => x.clase === clase));
}

function generar(spec) {
  rnd = rng(1000 + spec.numero * 77 + (+process.env.SEMILLA || 0) * 7919 + (spec.tema ? spec.tema.length * 131 + spec.tema.charCodeAt(0) * 17 : 0));
  const buenos = [], est = { noUnico: 0, variedad: 0, regalo: 0, noLogico: 0, victima: 0 };
  const t0 = Date.now(), tol = spec.sondeos <= 2 ? 0 : spec.sondeos <= 5 ? 1 : 4;
  for (let a = 0; a < 4000 && buenos.length < 30 && Date.now() - t0 < (process.env.TIEMPO ? +process.env.TIEMPO * 1000 : spec.size >= 8 ? 240000 : 90000) && !(buenos.length >= (spec.size >= 8 ? 1 : 4) && buenos.some((b) => Math.abs(b.sondeos - spec.sondeos) <= tol)); a++) {
    const base = construirBase(spec);
    const caso = { size: spec.size, ...base, personajes: [] };
    const sol = solucionAzar(caso, spec);
    if (!sol) continue;
    const cands = {}; for (const id of spec.elenco) cands[id] = candidatas(caso, spec, sol, id);
    if (spec.elenco.slice(1).some((id) => !cands[id].length)) continue;
    cands[spec.elenco[0]] = [{ w: 1, clase: 'libre', pista: { tipo: 'libre' } }];
    for (let t = 0; t < 4; t++) {
      const eleg = spec.elenco.map((id) => sortea(cands[id]));
      const arma = () => { caso.personajes = spec.elenco.map((id, i) => ({ id, ...(i === 0 ? { victima: true, pista: { tipo: 'libre' } } : { pista: eleg[i].pista }) })); };
      arma();
      // reparación: mientras exista otra solución, cambia la coartada de alguien que esté en otro lugar por una que la descarte
      let unico = false;
      for (let rep = 0; rep < 90; rep++) {
        const sols = K.soluciones(caso, 2);
        const alt = sols.find((x) => spec.elenco.some((id) => x[id][0] !== sol[id][0] || x[id][1] !== sol[id][1]));
        if (!alt) { unico = sols.length === 1; break; }
        const dif = baraja(spec.elenco.slice(1).filter((id) => alt[id][0] !== sol[id][0] || alt[id][1] !== sol[id][1]));
        let hecho = false;
        for (const id of dif) {
          const ops = cands[id].filter((x) => !K.evalPista(caso, x.pista, id, alt));
          if (!ops.length) continue;
          eleg[spec.elenco.indexOf(id)] = sortea(ops); arma(); hecho = true; break;
        }
        if (!hecho) break;
      }
      if (!unico) { est.noUnico++; continue; }
      const cuenta = {}; eleg.slice(1).forEach((e) => (cuenta[e.clase] = (cuenta[e.clase] || 0) + 1));
      if (Object.keys(cuenta).length < 3 || (cuenta.sala || 0) + (cuenta.todas || 0) > (spec.tier === 1 ? 3 : 2) || (cuenta.linea || 0) > 1) { est.variedad++; continue; }
      const L = K.libres(caso);
      const unarios = caso.personajes.map((p) => L.filter((rc) => K.partes(p.pista).every((q) => !K.esUnaria(q) || K.evalPista(caso, q, p.id, { [p.id]: rc }))).length);
      if (unarios.slice(1).some((u) => u < 2)) { est.regalo++; continue; }
      const lg = K.resolverLogico(caso);
      if (!lg.ok) { est.noLogico++; continue; }
      if (lg.pasos[lg.pasos.length - 1].id !== spec.elenco[0]) { est.victima++; continue; }
      if (lg.sondeos < (+process.env.MINS || 0)) { est.facil = (est.facil || 0) + 1; continue; }
      buenos.push({ caso: JSON.parse(JSON.stringify(caso)), sol, sondeos: lg.sondeos, pasos: lg.pasos.length });
      break;
    }
  }
  console.log('  descartes', JSON.stringify(est));
  if (!buenos.length) throw new Error('Caso ' + spec.numero + ': no encontré puzzle válido');
  buenos.sort((x, y) => Math.abs(x.sondeos - spec.sondeos) - Math.abs(y.sondeos - spec.sondeos));
  const b = buenos[0];
  console.log(`caso ${spec.numero}: ${buenos.length} candidatos, sondeos elegidos=${b.sondeos} (objetivo ${spec.sondeos}), rango=[${Math.min(...buenos.map((x) => x.sondeos))}..${Math.max(...buenos.map((x) => x.sondeos))}]`);
  return {
    id: (spec.tema || 'kanto') + '-' + String(spec.numero).padStart(2, '0'), tema: spec.tema || 'kanto', numero: spec.numero, titulo: spec.titulo, lugar: spec.lugar, dificultad: spec.dificultad,
    size: spec.size, rooms: b.caso.rooms, salas: b.caso.salas, objs: b.caso.objs, personajes: b.caso.personajes,
    historia: spec.historia, movil: spec.movil, culpable: spec.culpable,
  };
}

/* Uso:
     node herramientas/generar.js 7        -> genera solo el caso 7 en herramientas/tmp/caso-7.json
     node herramientas/generar.js --unir   -> junta todos los tmp en casos.js
     node herramientas/generar.js          -> genera todo (lento) y escribe casos.js */
const tmp = path.join(__dirname, 'tmp');
const arg = process.argv[2];
function escribir(casos) {
  for (const c of casos) { const s = K.soluciones(c, 2); if (s.length !== 1) throw new Error(c.id + ' no es único'); c.sol = s[0]; }
  const salida = '/* Generado por herramientas/generar.js — no editar a mano. Verificar con: node herramientas/verificar.js */\n' +
    '(function (r) { r.COARTADA_CASOS = ' + JSON.stringify(casos) + '; })(typeof window !== "undefined" ? window : module.exports);\n';
  fs.writeFileSync(path.join(__dirname, '..', 'casos.js'), salida);
  console.log('casos.js escrito con', casos.length, 'casos');
}
const EXTRA = require('./temas.js')(S);
if (EXTRA[arg]) {
  /* node herramientas/generar.js simpson 3      -> genera ese caso en tmp/simpson-3.json
     node herramientas/generar.js simpson --unir -> escribe casos-simpson.js */
  const lista = EXTRA[arg].map((s) => ({ ...s, tema: arg })), n = process.argv[3];
  fs.mkdirSync(tmp, { recursive: true });
  if (n === '--unir') {
    const casos = lista.map((s) => JSON.parse(fs.readFileSync(path.join(tmp, arg + '-' + s.numero + '.json'), 'utf8')));
    for (const c of casos) { const s = K.soluciones(c, 2); if (s.length !== 1) throw new Error(c.id + ' no es único'); c.sol = s[0]; }
    fs.writeFileSync(path.join(__dirname, '..', 'casos-' + arg + '.js'), '/* Generado por herramientas/generar.js — no editar a mano. */\n(function (r) { r.COARTADA_CASOS = (r.COARTADA_CASOS || []).concat(' + JSON.stringify(casos) + '); })(typeof window !== "undefined" ? window : module.exports);\n');
    console.log('casos-' + arg + '.js escrito con', casos.length, 'casos');
  } else {
    const spec = lista.find((s) => s.numero === +n);
    fs.writeFileSync(path.join(tmp, arg + '-' + spec.numero + '.json'), JSON.stringify(generar(spec)));
  }
} else if (arg === '--unir') {
  escribir(SPECS.map((s) => JSON.parse(fs.readFileSync(path.join(tmp, 'caso-' + s.numero + '.json'), 'utf8'))));
} else if (arg) {
  fs.mkdirSync(tmp, { recursive: true });
  const spec = SPECS.find((s) => s.numero === +arg);
  fs.writeFileSync(path.join(tmp, 'caso-' + spec.numero + '.json'), JSON.stringify(generar(spec)));
} else {
  escribir(SPECS.map(generar));
}
