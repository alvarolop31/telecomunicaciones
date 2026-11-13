# Zombies con la EETP

Juego de disparos en primera persona con modo zombies. Está hecho con JavaScript y Three.js, así que no hace falta instalar nada: se juega en el navegador.

## Cómo jugar

1. Abrí `index.html` en el navegador. Necesita internet para cargar Three.js.
2. Tocá **Iniciar**.

## Controles

- **WASD**: moverse · **Shift**: correr · **Mouse**: mirar
- **Click izquierdo**: disparar · **Click derecho**: apuntar (solo en las armas que lo tienen)
- **1 / 2**: cambiar de arma · **R**: recargar · **V**: cuchillo
- **E**: comprar en la pared · **F**: abrir o cerrar la puerta, o reparar una ventana · **G**: bomba
- **Esc**: pausa

## Archivos

- `index.html`: pantallas, menús y HUD
- `mapa.js` y `mapa2.js`: el mapa (zonas, caminos, río con puentes, edificios y base)
- `mundo3.js`: escenario, colisiones, ventanas y la forma en que los zombies las rompen
- `decor2.js`: adornos de cada zona (árboles, lápidas, castillo, pantano, faroles)
- `sonido.js`: sonidos sintetizados en el navegador, sin archivos de audio
- `game.js`: lógica del juego (armas, zombies, oleadas, power-ups y HUD)

## Pruebas (opcional)

Con Node.js instalado se pueden correr dos chequeos desde la carpeta del proyecto:

- `node tests/run.js`: arranca una partida simulada y revisa que no haya errores
- `node tests/check.js`: dibuja el mapa en texto y revisa que todas las zonas se puedan alcanzar
