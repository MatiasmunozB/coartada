/* AUDITORÍA de casos. Uso: node herramientas/verificar.js
   Revisa exactamente los casos que carga index.html (los <script src="casos…"> que no están comentados).
   Para cada caso:
   1. Plano bien formado y habitaciones conexas.
   2. Fuerza bruta propia (sin atajos del motor): EXACTAMENTE una solución, y es la guardada.
   3. Cada coartada se cumple en la solución, y el culpable es el único a solas con la víctima.
   4. Coherencia de cada coartada, con un chequeo propio e independiente del motor:
      - todo objeto mencionado existe;
      - "en A o en B, al lado de X": en A y en B hay una casilla libre junto a un X de esa misma habitación;
      - "al lado" nunca cruza una pared.
   5. Juega el caso como una persona siguiendo las pistas del botón 💡, de la primera a la última:
      cada pista pone a alguien en su casilla correcta, sin chocar fila/columna con lo ya puesto,
      explica por qué se descarta cada una de sus otras casillas, y la víctima queda para el final.
   6. Reglas del juego: víctima sin coartada y nadie la menciona, iniciales únicas, Michael en The Office.
   7. Los carteles de las habitaciones caben (letra legible incluso con casillas chicas).
   8. Cada mundo tiene 5 casos y la dificultad no baja. */
const K = require('../motor.js');
const fs = require('fs'), path = require('path');
const raiz = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(raiz, 'index.html'), 'utf8').replace(/<!--[\s\S]*?-->/g, '');
const archivos = [...html.matchAll(/<script src="(casos[^"?]*\.js)/g)].map((m) => m[1]);
const CASOS = [];
for (const f of archivos) { delete require.cache[require.resolve('../' + f)]; const m = require('../' + f); for (const c of m.COARTADA_CASOS) if (!CASOS.includes(c)) CASOS.push(c); }

let todoOk = true, avisos = 0;
const falla = (c, m) => { todoOk = false; console.log(`  ✗ ${c.id}: ${m}`); };
const aviso = (c, m) => { avisos++; console.log(`  ! ${c.id}: ${m}`); };
const libre = (c, r, k) => { const o = c.objs.find((x) => x.r === r && x.c === k); return !o || K.OBJ_INFO[o.t].pisable; };
const nombreCelda = (r, k) => 'ABCDEFGHIJ'[k] + (r + 1);

console.log('Archivos auditados:', archivos.join(', '), '\n');
for (const c of CASOS) {
  const n = c.size, ids = c.personajes.map((p) => p.id);
  // 1) estructura
  if (c.rooms.length !== n || c.rooms.some((f) => f.length !== n)) falla(c, 'plano mal formado');
  if (ids.length !== n) falla(c, 'cantidad de personajes distinta al tamaño');
  for (const s of new Set(c.rooms.join(''))) {
    const cel = []; for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (c.rooms[r][k] === s) cel.push(r * n + k);
    const vis = new Set([cel[0]]), cola = [cel[0]];
    while (cola.length) { const x = cola.pop(), r = Math.floor(x / n), k = x % n;
      for (const [a, b] of [[r - 1, k], [r + 1, k], [r, k - 1], [r, k + 1]]) if (a >= 0 && b >= 0 && a < n && b < n && c.rooms[a][b] === s && !vis.has(a * n + b)) { vis.add(a * n + b); cola.push(a * n + b); } }
    if (vis.size !== cel.length) falla(c, 'habitación ' + s + ' partida en dos');
    if (!c.salas[s]) falla(c, 'habitación sin nombre ' + s);
  }
  for (const o of c.objs) if (!K.OBJ_INFO[o.t]) falla(c, 'objeto desconocido ' + o.t);
  for (const id of ids) if (!K.PERSONAJES[id]) falla(c, 'personaje desconocido ' + id);

  // 2) fuerza bruta propia
  let cuenta = 0, unica = null;
  const pos = {}, cand = {};
  for (const p of c.personajes) { cand[p.id] = [];
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) { if (K.bloqueada(c, r, k)) continue;
      if (K.partes(p.pista).every((q) => !K.esUnaria(q) || K.evalPista(c, q, p.id, { [p.id]: [r, k] }))) cand[p.id].push([r, k]); } }
  const orden = [...ids].sort((a, b) => cand[a].length - cand[b].length);
  (function rec(i, F, C) {
    if (i === orden.length) { if (K.validar(c, pos).ok) { cuenta++; unica = JSON.stringify(pos); } return; }
    for (const [r, k] of cand[orden[i]]) { if (F & (1 << r) || C & (1 << k)) continue; pos[orden[i]] = [r, k]; rec(i + 1, F | (1 << r), C | (1 << k)); delete pos[orden[i]]; }
  })(0, 0, 0);
  if (cuenta !== 1) falla(c, `tiene ${cuenta} soluciones (debe ser 1)`);
  const guardada = {}; for (const id of ids) guardada[id] = c.sol[id];
  if (cuenta === 1 && JSON.stringify(JSON.parse(unica), ids) !== JSON.stringify(guardada, ids)) falla(c, 'la solución guardada no coincide');

  // 3) solución y culpable
  if (!K.validar(c, c.sol).ok) falla(c, 'la solución guardada no cumple todas las coartadas');
  if (K.culpable(c, c.sol) !== c.culpable) falla(c, 'el culpable no queda a solas con la víctima');

  // 4) coherencia de coartadas (chequeo propio + el del motor)
  for (const p of c.personajes) {
    const qs = K.partes(p.pista), txt = K.textoPista(c, p).replace(/<[^>]+>/g, '');
    if (!K.pistaCoherente(c, p.pista)) falla(c, `${K.nom(p.id)}: coartada incoherente según el motor — "${txt}"`);
    const junto = qs.find((q) => q.tipo === 'junto'), salas = qs.find((q) => q.tipo === 'salaO' || q.tipo === 'sala');
    for (const q of qs) if (q.obj && !c.objs.some((o) => o.t === q.obj)) falla(c, `${K.nom(p.id)}: menciona ${q.obj}, que no está en el mapa`);
    if (junto && salas) for (const s of salas.salas || [salas.sala]) {
      let hay = false;
      for (let r = 0; r < n && !hay; r++) for (let k = 0; k < n && !hay; k++)
        if (c.rooms[r][k] === s && libre(c, r, k) && c.objs.some((o) => o.t === junto.obj && Math.abs(o.r - r) + Math.abs(o.c - k) === 1 && c.rooms[o.r][o.c] === s)) hay = true;
      if (!hay) falla(c, `${K.nom(p.id)}: dice "${c.salas[s].nombre}… al lado de ${junto.obj}", pero en ${c.salas[s].nombre} no hay ninguno utilizable — "${txt}"`);
    }
    if (junto) { const [r, k] = c.sol[p.id];
      if (!c.objs.some((o) => o.t === junto.obj && Math.abs(o.r - r) + Math.abs(o.c - k) === 1 && c.rooms[o.r][o.c] === c.rooms[r][k])) falla(c, `${K.nom(p.id)}: "al lado de ${junto.obj}" no se cumple dentro de su habitación`); }
  }

  // 5) jugar siguiendo las pistas
  const lg = K.resolverLogico(c);
  if (!lg.ok) falla(c, 'siguiendo la lógica no se puede cerrar el caso sin adivinar');
  const tablero = {}, F = new Set(), Cc = new Set();
  for (const [i, paso] of lg.pasos.entries()) {
    const quien = K.nom(paso.id), donde = nombreCelda(paso.r, paso.c);
    if (paso.r !== c.sol[paso.id][0] || paso.c !== c.sol[paso.id][1]) { falla(c, `pista ${i + 1}: pone a ${quien} en ${donde}, que no es su casilla`); break; }
    if (F.has(paso.r) || Cc.has(paso.c)) { falla(c, `pista ${i + 1}: ${quien} en ${donde} choca con alguien ya ubicado`); break; }
    if (tablero[paso.id]) falla(c, `pista ${i + 1}: ${quien} se ubica dos veces`);
    tablero[paso.id] = [paso.r, paso.c]; F.add(paso.r); Cc.add(paso.c);
    if (!paso.inicial.includes(donde)) falla(c, `pista ${i + 1}: ${donde} no estaba entre las casillas que permite la coartada de ${quien}`);
    const explicadas = paso.descartes.flatMap((d) => d.celdas);
    const sinExplicar = paso.inicial.filter((x) => x !== donde && !explicadas.includes(x));
    if (sinExplicar.length) falla(c, `pista ${i + 1}: no explica por qué ${quien} no va en ${sinExplicar.join(', ')}`);
    if (paso.descartes.some((d) => d.razon === 'queda descartada por las demás')) aviso(c, `pista ${i + 1}: una casilla de ${quien} se descarta sin razón concreta`);
  }
  if (lg.ok && Object.keys(tablero).length !== ids.length) falla(c, 'las pistas no ubican a todos');
  if (lg.ok && !K.validar(c, tablero).ok) falla(c, 'el tablero que arman las pistas no es válido');

  // 6) reglas del juego
  const vic = c.personajes.find((p) => p.victima);
  if (!vic || vic.pista.tipo !== 'libre') falla(c, 'la víctima tiene coartada');
  if (lg.ok && lg.pasos[lg.pasos.length - 1].id !== vic.id) falla(c, 'la víctima no es la última en ubicarse');
  if (c.personajes.some((p) => K.partes(p.pista).some((q) => q.con === vic.id))) falla(c, 'una coartada menciona a la víctima');
  if (c.tema === 'office' && !ids.includes('michael')) falla(c, 'falta Michael');
  const ini = Object.values(K.iniciales(c)); if (new Set(ini).size !== ini.length) falla(c, 'iniciales repetidas');

  // 7) carteles de habitaciones: la palabra más larga cabe en el ancho del cartel sin cortarse
  //    (casilla de 40 px = celular, 64 px = computador), y el nombre completo cabe en 2 líneas
  for (const [s, e] of Object.entries(K.etiquetas(c))) for (const cell of [40, 64]) {
    const px = K.letraEtiqueta(e, cell), ancho = cell * e.len - 10;
    if (e.palabra * 0.78 * px > ancho + 0.5) falla(c, `el cartel "${c.salas[s].nombre}" no cabe con casillas de ${cell} px`);
    else if (e.total * 0.78 * px > ancho * 2 + 0.5) aviso(c, `el cartel "${c.salas[s].nombre}" ocuparía 3 líneas con casillas de ${cell} px`);
  }
  console.log(`${cuenta === 1 && lg.ok ? '✓' : '✗'} ${c.id}  ${n}x${n}  soluciones=${cuenta}  culpable=${c.culpable}  pistas=${lg.pasos.length}  hipótesis=${lg.sondeos}  "${c.titulo}"`);
}

// 8) mundos
const temas = [...new Set(CASOS.map((c) => c.tema))];
for (const t of temas) {
  const l = CASOS.filter((c) => c.tema === t).sort((a, b) => a.numero - b.numero);
  if (l.length !== 5) { todoOk = false; console.log(`  ✗ mundo ${t}: tiene ${l.length} casos (deben ser 5)`); }
  if (l.some((c, i) => i && (c.dificultad < l[i - 1].dificultad || c.size < l[i - 1].size))) { todoOk = false; console.log(`  ✗ mundo ${t}: la dificultad baja de un caso al siguiente`); }
}
console.log(`\nMundos: ${temas.join(', ')} · ${CASOS.length} casos · ${avisos} avisos`);
console.log(todoOk ? 'AUDITORÍA OK: todos los casos tienen solución única, coartadas coherentes y se resuelven siguiendo las pistas.' : 'HAY CASOS CON PROBLEMAS.');
process.exit(todoOk ? 0 : 1);
