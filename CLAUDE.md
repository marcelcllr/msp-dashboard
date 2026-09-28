# MSP Dashboard — My Secret Passion MX

Contexto para Claude Code. Léelo antes de tocar cualquier cosa.

## El negocio
- "My Secret Passion MX": venta de mieles de Malasia y productos para adultos en Monterrey, NL.
- Socios: Marcel y Gustavo. Venta menudeo y mayoreo.
- Marcas: Black Horse, Royal Honey, Royal Honey for Her, Royal Honey Platinum, Bliss Bears (Mujer), Boner Bears (Hombre), entre otras.
- El dashboard es el sistema financiero central: ventas, inventario, gastos, clientes, corte de caja y reparto de utilidades.
- Marcel no es programador. Habla español casual (México). Respuestas directas, sin jerga, sin rollo.

## Stack
- React 18 + Vite 5 + Recharts + Supabase JS.
- Toda la app vive en UN solo archivo: `src/App.jsx`.
- `src/supabase.js`: cliente + helpers `dbLoad(key, def)` / `dbSave(key, value)`.
- Base de datos: Supabase, proyecto `frsvrgojdttnajxdakxv`, tabla `msp_store` (key/value, value = JSON string).
- Deploy: Vercel (msp-dashboard-kappa.vercel.app), auto-deploy al hacer push a `main`.
- Repo: github.com/marcelcllr/msp-dashboard
- Variables en Vercel: `VITE_APP_PASSWORD` (respaldo para Marcel/Gustavo), `VITE_PWD_MARCEL`, `VITE_PWD_GUSTAVO`, `VITE_PWD_EMPLEADO`, `VITE_EMPLEADO_NOMBRE` (opcional).

## Usuarios y permisos
- `USERS` en App.jsx: Marcel y Gustavo = `admin`, empleado = `staff`. Sesión en `sessionStorage` (`msp_user`).
- Staff solo ve: Nueva venta, Palomitas, Inventario, Gastos, Clientes. No ve Inicio, Corte, Reparto, Productos (costos) ni Paquetes.
- Dentro de las pantallas, staff NO ve utilidad/margen/costos, no puede borrar ventas, gastos, movimientos ni clientes, no pone precios especiales, no ve ni registra gastos fijos (`FIXED_CATS`), solo ve sus propios gastos y las ventas de hoy.
- Todo registro nuevo guarda `by` (quién lo hizo). Las ventas guardan `bajoPrecio` si se cobró debajo del precio de lista/cliente.
- OJO: es control de pantalla, no seguridad real. La llave de Supabase es pública y las contraseñas `VITE_*` van dentro del JS. Seguridad real = Supabase Auth + RLS (pendiente).
- Menú inferior fijo (`BottomNav`); lo que no cabe va en "Más". `NAV_MAIN` define qué va fijo por rol.

## Gastos fijos
- `msp-fx4`: lista de fijos (default: Renta $7,859 mensual, Sueldo empleado $2,000 semanal).
- Al marcar "Ya se pagó" se crea un gasto normal con `fixedId` + `period` ("YYYY-MM" o lunes de la semana). Pendientes salen como aviso en Inicio.

## Correr local
```
npm install
npm run dev
```
Antes de hacer push SIEMPRE correr `npm run build` y confirmar que compila.

## Módulos actuales
- **POS / Nueva Venta**: selección de producto con precio de mayoreo automático por niveles; modo precio especial para clientes fijos (se guarda en su perfil); alta rápida de cliente con precios especiales colapsables.
- **Inventario**: cargador masivo (cajas + sobres), edición en línea por fila con historial de cambios.
- **Gastos**: registra de qué cuenta salió (Efectivo / SPIN Marcel / SPIN Gustavo) y se descuenta en el Corte de Caja.
- **Corte de Caja**: desglose por cuenta (ventas + transferencias mixtas + extras − gastos = neto). Pago "Mixto" se reparte entre cuentas y NO aparece como categoría aparte.
- **Envíos**: "cobro al cliente" y "costo del repartidor" separados, con ganancia/pérdida en tiempo real.
- **Utilidades Extra**: se suman a los totales por cuenta.
- **Palomitas** (pestaña 🍿): POS rápido para el local. 3 tamaños (Pequeño $20 / Mediano $35 / Grande $50), precios y costos editables guardados en `msp-pop4`. Cada cobro se guarda como venta normal en `sales` con `tipo:"palomitas"` y `clientId:""`, así entra solo en Corte, Reparto y Dashboard. No toca inventario.
- **Gastos del local**: categorías "Renta local", "Luz / agua / internet", "Sueldos", "Insumos palomitas".
- Equipo: 2 socios (Marcel, Gustavo) + 1 empleado usan la app.
- **Reparto de utilidades**: vista semanal (principal) y mensual, split 33% Marcel / 33% Gustavo / 34% Reinversión MSP, con gráficas de barras.
- **KPI**: tarjeta "Utilidad Neta del Mes" con borde verde/rojo.
- Catálogo: columnas por producto `costSobre`, `listSobre`, precio sobre (editables). Pink Pussycat 12 sobres fue descontinuado (eliminado).

## Reglas duras (bugs que ya nos pasaron)
1. **No declarar variables duplicadas** (ej. `exForm`, `PAY_METHODS_LABEL`): rompen el build de Vercel.
2. **Nunca definir componentes dentro de otros componentes**: causa pantalla en blanco. Todos los componentes van como funciones top-level.
3. **La migración de productos solo pone costos default a productos NUEVOS** sin valor. Nunca sobreescribir costos que el usuario ya editó al cargar la página.
4. **Venta por sobre usa `costSobre` y `listSobre`**, no el costo de caja, o la utilidad sale negativa.
5. Queries a Supabase: usar `.maybeSingle()`, no `.single()` (ojo: `dbLoad` en `supabase.js` todavía usa `.single()`).
6. Guardados con debounce de 800 ms (`setTimeout` / `clearTimeout`).
7. Los datos de Supabase son independientes del código: actualizar código NO borra datos.
8. Supabase free se pausa tras ~7 días sin uso → la app parece vacía (ERR_NAME_NOT_RESOLVED). Solución: supabase.com → "Resume project". Los datos no se pierden.

## Forma de trabajar
- Marcel prueba en celular en tiempo real. Diseño mobile-first.
- Cambios pequeños e incrementales; editar quirúrgico, no reescribir el archivo entero.
- Commit + push a `main` → Vercel publica en ~1 min.

## Pendiente
- Algunos costos de productos pueden seguir con valores provisionales; confirmar con Marcel.
