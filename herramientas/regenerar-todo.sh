#!/usr/bin/env bash
# Regenera los casos de los mundos activos en paralelo (8 a la vez), reintenta los que fallen con otras semillas,
# une todo y corre la auditoría.  Uso: bash herramientas/regenerar-todo.sh [tema ...]
# (Pokémon/Kanto está oculto: sus casos viven en casos.js y no se regeneran aquí.)
cd "$(dirname "$0")/.."
mkdir -p herramientas/tmp
TEMAS="${*:-office dbz hxh simpson lotr}"
trabajos() { for t in $TEMAS; do for n in 1 2 3 4 5; do echo "$t $n"; done; done; }
archivo() { echo "herramientas/tmp/$1-$2.json"; }
uno() {
  t=$1; n=$2; s=$3
  f=$(archivo $t $n); rm -f "$f"
  SEMILLA=$s node herramientas/generar.js $t $n > "herramientas/tmp/log-$t-$n.txt" 2>&1
  [ -f "$f" ] && echo "ok   $t $n (semilla $s)" || echo "FALLA $t $n (semilla $s)"
}
export -f uno archivo
for s in 0 11 22 33 44; do
  pend=$(trabajos | while read t n; do [ -f "herramientas/tmp/.hecho-$t-$n" ] || echo "$t $n"; done)
  [ -z "$pend" ] && break
  echo "== ronda semilla $s: $(echo "$pend" | wc -l) casos =="
  echo "$pend" | xargs -P 8 -L 1 bash -c 'uno $0 $1 '"$s"' && [ -f "$(archivo $0 $1)" ] && touch herramientas/tmp/.hecho-$0-$1'
done
rm -f herramientas/tmp/.hecho-*
for t in $TEMAS; do node herramientas/generar.js $t --unir; done
node herramientas/verificar.js
