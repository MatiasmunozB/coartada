#!/usr/bin/env bash
# Regenera los 28 casos en paralelo (8 a la vez), reintenta los que fallen con otras semillas,
# une todo y corre el verificador.  Uso: bash herramientas/regenerar-todo.sh
cd "$(dirname "$0")/.."
mkdir -p herramientas/tmp
trabajos() {
  for n in 1 2 3 4 5 6 7 8 9 10; do echo "kanto $n"; done
  for t in simpson office dbz; do for n in 1 2 3 4 5 6; do echo "$t $n"; done; done
}
archivo() { [ "$1" = kanto ] && echo "herramientas/tmp/caso-$2.json" || echo "herramientas/tmp/$1-$2.json"; }
uno() {
  t=$1; n=$2; s=$3
  f=$(archivo $t $n); rm -f "$f"
  if [ "$t" = kanto ]; then SEMILLA=$s node herramientas/generar.js $n; else SEMILLA=$s node herramientas/generar.js $t $n; fi > "herramientas/tmp/log-$t-$n.txt" 2>&1
  [ -f "$f" ] && echo "ok   $t $n (semilla $s)" || echo "FALLA $t $n (semilla $s)"
}
export -f uno archivo
for s in 0 11 22 33; do
  pend=$(trabajos | while read t n; do [ -f "$(archivo $t $n).ok$s" ] || [ -f "herramientas/tmp/.hecho-$t-$n" ] || echo "$t $n"; done)
  [ -z "$pend" ] && break
  echo "== ronda semilla $s: $(echo "$pend" | wc -l) casos =="
  echo "$pend" | xargs -P 8 -L 1 bash -c 'uno $0 $1 '"$s"' && [ -f "$(archivo $0 $1)" ] && touch herramientas/tmp/.hecho-$0-$1'
done
rm -f herramientas/tmp/.hecho-*
node herramientas/generar.js --unir && for t in simpson office dbz; do node herramientas/generar.js $t --unir; done
node herramientas/verificar.js
