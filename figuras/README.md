# Mis Figuras

Una app pequeña que se puede quedar **siempre encima** de las demás ventanas, para llevar el control de tu colección de figuras.

## Qué hace

- **Compradas**: tu colección, con imagen y el valor total.
- **Pre-orden**: con fecha de salida, fecha límite de pago, anticipo y cuánto falta. Botón **✓ Llegó** para pasarla a compradas.
- **Deseadas**: las que quieres comprar. Botones para pasarlas a *Pre-ordenar* o *Comprada*.
- **Pagos**: el total de dinero por pagar, el próximo pago, y una lista con barra de progreso. Puedes **Abonar** una cantidad o **Liquidar** el resto. Los pagos vencidos salen en rojo y los de los próximos 7 días en amarillo.
- 🖼 **Vitrina**: tus figuras en grande, ocupando toda la pantalla. El nombre se ve tenue y borroso, y se ve nítido al pasar el ratón. Si una figura tiene varias imágenes, cada vez que le vuelve a tocar muestra la siguiente (los puntitos bajo el nombre indican cuál). Arriba eliges qué listas exhibir (**Compradas**, **Pre-orden**, **Deseadas**, combinables), la velocidad, orden aleatorio 🔀, ▣ para ver la figura completa en vez de llenar la pantalla, ℹ para ocultar el nombre y ⛶ pantalla completa. Teclas: ← → para cambiar de figura, ↑ ↓ para ver otra imagen de la misma figura, espacio para pausar, F para pantalla completa, I para el nombre y Esc para salir. Para que una figura no salga en la vitrina, desmarca *Exhibir en la vitrina* al editarla.
- **Imágenes**: cada figura puede tener varias. Haz clic para elegir archivos (puedes seleccionar varios a la vez), arrástralos, pégalos con Ctrl+V o añade URLs. La que tiene ★ es la principal; haz clic en otra para hacerla principal. Con ⤢ la ves en grande, y si haces clic en la imagen pasas a la siguiente.
- 📌 **Siempre encima**: en el navegador abre una ventana flotante y en la versión de escritorio fija la ventana.
- ⚙ Ajustes: moneda y exportar o importar una copia de seguridad (.json).

## Versión navegador (recomendada): `mis-figuras.html`

Es **un solo archivo**. Descárgalo, guárdalo en una carpeta fija (por ejemplo `Documentos/MisFiguras/`) y ábrelo con doble clic. No necesitas instalar nada.

- Por defecto tus datos se guardan en el navegador (IndexedDB), así que **no muevas ni renombres el archivo**, porque el navegador lo tomaría como otra página y no vería tus datos. Usa ⚙ → *Exportar copia* de vez en cuando. Para no guardar nada en la PC, mira *Guardar todo en Google Drive* más abajo.
- 📌 **Ventana flotante siempre encima** (Chrome o Edge): abre la app en una ventana pequeña que se queda encima de todas las demás. Ciérrala o pulsa 📌 otra vez para que vuelva a la pestaña.

### Guardar todo en Google Drive (nada en la PC)

Si no quieres que las imágenes queden guardadas en la computadora, la app puede guardar todo (datos e imágenes) en una carpeta de Google Drive. Funciona en **Chrome o Edge**.

1. Instala **Google Drive para escritorio**. En sus preferencias elige **"Transmitir archivos"** (*Stream files*), no "Duplicar archivos" (*Mirror*): duplicar copia todo a la PC.
2. En la app ve a ⚙ → **☁ Guardar en Google Drive…** y elige o crea una carpeta en tu unidad, por ejemplo `G:\Mi unidad\MisFiguras`.
3. Tus figuras se mueven a esa carpeta (`mis-figuras.json` y una subcarpeta `imagenes/`) y **se borran del navegador**. En el navegador solo queda recordado cuál es la carpeta.

Después:
- Si Google Drive está activo, la app carga tus figuras desde la carpeta. Chrome puede pedirte permiso otra vez al reiniciarlo: pulsa **Abrir mis figuras** (y, si te lo ofrece, *Permitir en cada visita*).
- Si Google Drive no está activo, la app no muestra nada y te avisa. Cuando abras Drive, pulsa *Reintentar* o simplemente vuelve a la ventana.
- Si usas la app en otra PC con la misma carpeta, al volver a la ventana se recargan los cambios.
- También puedes guardar `mis-figuras.html` dentro de la carpeta de Drive. Así ni siquiera la app queda en la PC, y solo abre cuando Drive está activo.

Nota: en modo "Transmitir", Google Drive guarda temporalmente en una caché los archivos que abres, y la va vaciando sola.

### Que se abra al abrir el navegador

Primero copia la ruta del archivo: ábrelo en el navegador y copia lo que sale en la barra de direcciones (algo como `file:///C:/Users/TuNombre/Documents/MisFiguras/mis-figuras.html`).

- **Chrome**: Configuración → *Al iniciar* → *Abrir una página específica o un conjunto de páginas* → *Añadir una página nueva* → pega la ruta.
- **Edge**: Configuración → *Inicio, página principal y nuevas pestañas* → *Cuando se inicia Edge* → *Abrir estas páginas* → *Agregar una página nueva* → pega la ruta.
- **Firefox**: Ajustes → *Inicio* → *Página de inicio y nuevas ventanas* → *Direcciones personalizadas* → pega la ruta.

Si cambias algo en `src/`, regenera el archivo con `node build-html.js`.

## Versión de escritorio (Electron)

Es una ventana propia, siempre encima, con opacidad ajustable. Usa sus propios datos, distintos de los de la versión navegador. Puedes pasar tus figuras de una a otra con *Exportar copia* e *Importar copia*.

### Cómo usarla

Necesitas [Node.js](https://nodejs.org) (versión 18 o más reciente).

```bash
cd figuras
npm install
npm start
```

#### Crear un ejecutable

```bash
npm run build:win     # Windows (.exe portable)
npm run build:mac     # macOS (.dmg)
npm run build:linux   # Linux (AppImage)
```

El ejecutable queda en `figuras/dist/`.

Los datos se guardan en la carpeta de datos de la app (`%APPDATA%/mis-figuras` en Windows, `~/Library/Application Support/mis-figuras` en macOS, `~/.config/mis-figuras` en Linux).
