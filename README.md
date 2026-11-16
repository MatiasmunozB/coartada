# Coartada

Juego de lógica tipo "murder mystery": ubica a cada sospechoso según su coartada (uno por fila y por columna) y descubre quién estaba a solas con la víctima.

Mundos: The Office, Dragon Ball Z, Hunter × Hunter, Los Simpson y El Señor de los Anillos (5 casos cada uno).

**Jugar:** https://matiasmunozb.github.io/coartada/

Proyecto de fans, sin fines de lucro, hecho para jugar entre amigos. Los personajes pertenecen a sus respectivos dueños; las ilustraciones y la música 8 bits son propias.

El avance de cada jugador se guarda solo en su propio navegador.

## Para desarrolladores
- `node herramientas/verificar.js` audita cada caso: solución única, coartadas coherentes y que se resuelva siguiendo las pistas.
- `herramientas/temas.js` define los casos de los mundos extra; `herramientas/generar.js` los genera.
