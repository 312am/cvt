# Mis Figuras

Una app de escritorio pequeña que se queda **siempre encima** de las demás ventanas, para llevar el control de tu colección de figuras.

## Qué hace

- **Compradas**: tu colección, con imagen y el valor total.
- **Pre-orden**: con fecha de salida, fecha límite de pago, anticipo y cuánto falta. Botón **✓ Llegó** para pasarla a compradas.
- **Deseadas**: las que quieres comprar. Botones para pasarlas a *Pre-ordenar* o *Comprada*.
- **Pagos**: el total de dinero por pagar, el próximo pago, y una lista con barra de progreso. Puedes **Abonar** una cantidad o **Liquidar** el resto. Los pagos vencidos salen en rojo y los de los próximos 7 días en amarillo.
- **Imágenes**: haz clic para elegir un archivo, arrástralo, pégalo con Ctrl+V o pon una URL. Haz clic en ⤢ para verla en grande.
- 📌 **Siempre encima** (se activa y desactiva con un clic), opacidad ajustable y la ventana recuerda su posición y tamaño.
- ⚙ Ajustes: moneda, opacidad, y exportar o importar una copia de seguridad (.json).

## Cómo usarla

Necesitas [Node.js](https://nodejs.org) (versión 18 o más reciente).

```bash
cd figuras
npm install
npm start
```

### Crear un ejecutable

```bash
npm run build:win     # Windows (.exe portable)
npm run build:mac     # macOS (.dmg)
npm run build:linux   # Linux (AppImage)
```

El ejecutable queda en `figuras/dist/`.

Los datos se guardan en la carpeta de datos de la app (`%APPDATA%/mis-figuras` en Windows, `~/Library/Application Support/mis-figuras` en macOS, `~/.config/mis-figuras` en Linux).

> También puedes abrir `src/index.html` en un navegador para probarla. Ahí no funciona lo de "siempre encima" y los datos se guardan en el navegador.
