# 🔪 ChefCost

**Rentabilidad del menú para restaurantes: escandallos, food cost e ingeniería de menú.**

**Demo en vivo:** https://jonaromerovilla-gif.github.io/chefcost/

La mayoría de los restaurantes pequeños fija precios "a ojo" y no sabe cuánto gana con cada plato. ChefCost calcula el costo real de cada receta y señala qué platos están perdiendo dinero y por qué.

Lo creó un chef convertido en desarrollador.

## Funciones

- **Escandallos:** costo por porción con merma y rendimiento real de cada ingrediente.
- **Food cost y margen** por plato, con alertas cuando un plato pasa del objetivo.
- **Precio sugerido** para alcanzar el food cost objetivo.
- **Pérdida recuperable:** cuánto dinero se escapa al mes por platos mal costeados.
- **Matriz de ingeniería de menú** (Kasavana & Smith): Estrellas, Caballos, Puzzles y Perros, con recomendaciones.
- **Simulador de precios de proveedores:** "si el aguacate sube 20 %, ¿qué pasa con mi margen?" (plan Mediano).
- **Informe de auditoría en PDF** con resumen ejecutivo, plan de acción priorizado por ganancia estimada y tus datos de consultor.
- **Varios restaurantes** en una misma cuenta, para consultores que auditan a más de un cliente.
- **Importación rápida:** pega platos o ingredientes directamente desde Excel o Google Sheets.
- **Planes configurables** (Pequeño / Mediano / Grande) con límites y funciones por plan.

## Planes

| | Pequeño | Mediano | Grande |
|---|---|---|---|
| Renta mensual | $19 | $49 | desde $149 |
| Renta anual | $190 | $490 | desde $1,490 |
| Compra | $399 | $999 | desde $3,000 |

## Stack

React 18 · TypeScript · Vite · SVG propio para los gráficos (sin librerías de gráficos) · GitHub Actions + GitHub Pages.

## Desarrollo

```bash
npm install
npm run dev
```

## Hoja de ruta

- [ ] Cuentas de usuario y datos en la nube
- [ ] Pagos (Stripe / Mercado Pago)
- [ ] Subrecetas (salsas, fondos, masas)
- [ ] Varias sucursales
- [ ] IA para leer facturas de proveedores
- [ ] Integración con POS
