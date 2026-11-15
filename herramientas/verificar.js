/* Verificador independiente. Uso: node herramientas/verificar.js
   Recorre TODAS las ubicaciones posibles (fuerza bruta propia, sin atajos del motor) y exige una única solución. */
const K = require('../motor.js');
const fs = require('fs'), path = require('path');
const CASOS = fs.readdirSync(path.join(__dirname, '..')).filter((f) => /^casos.*\.js$/.test(f)).sort().flatMap((f) => require('../' + f).COARTADA_CASOS);

let todoOk = true;
const falla = (c, m) => { todoOk = false; console.log(`  ✗ ${c.id}: ${m}`); };

for (const c of CASOS) {
  const n = c.size, ids = c.personajes.map((p) => p.id);
  // 1) estructura
  if (c.rooms.length !== n || c.rooms.some((f) => f.length !== n)) falla(c, 'plano mal formado');
  if (ids.length !== n) falla(c, 'cantidad de personajes distinta al tamaño');
  for (const s of new Set(c.rooms.join(''))) { // habitaciones conexas
    const cel = []; for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (c.rooms[r][k] === s) cel.push(r * n + k);
    const vis = new Set([cel[0]]), cola = [cel[0]];
    while (cola.length) { const x = cola.pop(), r = Math.floor(x / n), k = x % n;
      for (const [a, b] of [[r - 1, k], [r + 1, k], [r, k - 1], [r, k + 1]]) if (a >= 0 && b >= 0 && a < n && b < n && c.rooms[a][b] === s && !vis.has(a * n + b)) { vis.add(a * n + b); cola.push(a * n + b); } }
    if (vis.size !== cel.length) falla(c, 'habitación ' + s + ' partida en dos');
    if (!c.salas[s]) falla(c, 'habitación sin nombre ' + s);
  }
  // 2) fuerza bruta propia: permutaciones fila→columna por personaje, usando el MISMO validar() que usa el botón Acusar
  let cuenta = 0, unica = null;
  const pos = {};
  // poda: casillas que cumplen la parte "individual" de cada coartada
  const cand = {}; for (const p of c.personajes) { cand[p.id] = [];
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) { if (K.bloqueada(c, r, k)) continue;
      if (K.partes(p.pista).every((q) => !K.esUnaria(q) || K.evalPista(c, q, p.id, { [p.id]: [r, k] }))) cand[p.id].push([r, k]); } }
  const orden = [...ids].sort((a, b) => cand[a].length - cand[b].length);
  (function rec(i, F, C) {
    if (i === orden.length) { if (K.validar(c, pos).ok) { cuenta++; unica = JSON.stringify(pos); } return; }
    for (const [r, k] of cand[orden[i]]) { if (F & (1 << r) || C & (1 << k)) continue; pos[orden[i]] = [r, k]; rec(i + 1, F | (1 << r), C | (1 << k)); delete pos[orden[i]]; }
  })(0, 0, 0);
  if (cuenta !== 1) falla(c, `tiene ${cuenta} soluciones (debe ser 1)`);
  // 3) la solución guardada es esa, y el culpable es el declarado
  const guardada = {}; for (const id of ids) guardada[id] = c.sol[id];
  if (cuenta === 1 && JSON.stringify(JSON.parse(unica), ids) !== JSON.stringify(guardada, ids)) falla(c, 'la solución guardada no coincide');
  if (!K.validar(c, c.sol).ok) falla(c, 'la solución guardada no pasa validar()');
  if (K.culpable(c, c.sol) !== c.culpable) falla(c, 'el culpable no queda a solas con la víctima');
  // 4) se puede deducir paso a paso
  const lg = K.resolverLogico(c);
  if (!lg.ok) falla(c, 'el solver lógico no lo cierra');
  // 5) chequeo propio de "al lado": el objeto debe estar en la MISMA habitación que el personaje
  for (const p of c.personajes) for (const q of K.partes(p.pista)) if (q.tipo === 'junto') {
    const [r, k] = c.sol[p.id];
    const ok = c.objs.some((o) => o.t === q.obj && Math.abs(o.r - r) + Math.abs(o.c - k) === 1 && c.rooms[o.r][o.c] === c.rooms[r][k]);
    if (!ok) falla(c, `${K.nom(p.id)}: "al lado de ${q.obj}" no se cumple dentro de su habitación`);
  }
  const vic = c.personajes.find((p) => p.victima);
  if (vic.pista.tipo !== 'libre') falla(c, 'la víctima tiene coartada');
  if (lg.ok && lg.pasos[lg.pasos.length - 1].id !== vic.id) falla(c, 'la víctima no es la última en ubicarse');
  if (c.personajes.some((p) => K.partes(p.pista).some((q) => q.con === vic.id))) falla(c, 'una coartada menciona a la víctima');
  if (c.tema === 'office' && !ids.includes('michael')) falla(c, 'falta Michael');
  const ini = Object.values(K.iniciales(c)); if (new Set(ini).size !== ini.length) falla(c, 'iniciales repetidas');
  console.log(`${cuenta === 1 && lg.ok ? '✓' : '✗'} ${c.id}  ${n}x${n}  soluciones=${cuenta}  culpable=${c.culpable}  pasos=${lg.pasos.length}  hipótesis=${lg.sondeos}  "${c.titulo}"`);
}
console.log(todoOk ? '\nTODOS LOS CASOS OK: solución única y deducible.' : '\nHAY CASOS CON PROBLEMAS.');
process.exit(todoOk ? 0 : 1);
