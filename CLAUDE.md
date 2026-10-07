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
- El cliente de Supabase y `dbLoad(key, def)` / `dbSave(key, value)` están arriba de `App.jsx` (el viejo `src/supabase.js` se borró).
- Base de datos: Supabase, proyecto `frsvrgojdttnajxdakxv`, tabla `msp_store` (key/value, value = JSON string).
- Deploy: Vercel (msp-dashboard-kappa.vercel.app), auto-deploy al hacer push a `main`.
- Repo: github.com/marcelcllr/msp-dashboard
- Variables en Vercel: `VITE_APP_PASSWORD` (respaldo para Marcel/Gustavo), `VITE_PWD_MARCEL`, `VITE_PWD_GUSTAVO`, `VITE_PWD_EMPLEADO`, `VITE_EMPLEADO_NOMBRE` (opcional).

## Usuarios y permisos
- `USERS` en App.jsx: Marcel y Gustavo = `admin`, empleado = `staff`. Sesión en `sessionStorage` (`msp_user`).
- Menú socios: Inicio · Vender · Palomitas · Caja · Más (Envíos, Inventario, Gastos, Clientes, Catálogo, Reparto).
- Menú empleado: Vender · Palomitas · Envíos · Inventario · Caja · Más (Gastos, Clientes). No ve Inicio, Catálogo (costos) ni Reparto.
- **Caja** = `CierreDia` (todos) + `Cuentas` (solo socios). **Catálogo** = `Productos` + `Paquetes`.
- Staff NO ve cantidades de inventario del sistema (para que el conteo del Cierre sea a ciegas): en Inventario solo tiene "Registrar entrada" y "Abrir caja". Tampoco puede cambiar la fecha de ventas ni de gastos.
- Dentro de las pantallas, staff NO ve utilidad/margen/costos, no puede borrar ventas, gastos, movimientos ni clientes, no pone precios especiales, no ve ni registra gastos fijos (`FIXED_CATS`), solo ve sus propios gastos y las ventas de hoy.
- Todo registro nuevo guarda `by` (quién lo hizo). Las ventas guardan `bajoPrecio` si se cobró debajo del precio de lista/cliente.
- OJO: es control de pantalla, no seguridad real. La llave de Supabase es pública y las contraseñas `VITE_*` van dentro del JS. Seguridad real = Supabase Auth + RLS (pendiente).
- Menú inferior fijo (`BottomNav`); lo que no cabe va en "Más". `NAV_MAIN` define qué va fijo por rol.

## Gastos fijos (`GastosFijos`, key `msp-fx4` = {v, items})
- Cada fijo tiene su calendario: `mensual` (`dia` desde qué día se paga, `limite` día que vence; sin limite = fin de mes), `semanal` (`diaSemana` 0=dom … 3=miércoles) o `variable` (sin fecha ni monto fijo; `amount` = estimado al mes).
- Defaults: Renta $7,859 del 8 al 10 de cada mes · Sueldo empleado $2,000 cada miércoles · Repartidor fijo (cuota) $1,000 cada miércoles · Plan celular $150 al mes · Apartado aguinaldo $357.14 al mes · Publicidad variable (estimado $4,000/mes).
- `fixedDues` calcula los vencimientos desde `INICIO_OPERACION`; `fixedStatus` acomoda los pagos en orden (pagar antes cubre el siguiente) y da el estado: `vencido` / `urgente` (vence hoy) en rojo, `toca` en amarillo (renta desde el día 8; semanales 1 día antes; mensuales sin día 3 días antes), `proximo`, `adelantado` (al corriente).
- Pagar crea un gasto normal con `fixedId`, `period` (= fecha de vencimiento que cubre), fecha elegida, monto editable y cuenta (`CUENTAS_PAGO`: SPIN Marcel, SPIN Gustavo, Mercado Pago, Efectivo) con `deCaja:false`. Solo cuentan pagos con fecha ≥ arranque.
- Inicio avisa solo los `toca/urgente/vencido` (`fixedPending` devuelve [{f,st}]).
- Migración v4: a los fijos guardados se les puso su día (si no lo tenían) y la publicidad pasó a variable.
- Luz, agua e internet los paga la plaza: no son gasto.

## Cuentas (`Cuentas` en la pestaña Caja, solo socios; manuales en key `msp-mv4`)
- Cuentas: Caja (efectivo del local), Efectivo socios, SPIN Marcel, SPIN Gustavo, Mercado Pago (Transferencia MP + Terminal MP).
- `libroCuentas` arma todos los movimientos desde el arranque: ventas (Mixto se reparte), comisión terminal, pagos a repartidores, gastos (efectivo con `deCaja` → Caja, si no → Efectivo socios), ingresos extra (efectivo → Efectivo socios) y cierres (la Caja queda igual a lo contado: faltante/sobrante + entrega al socio → Efectivo socios).
- A mano: `traspaso` (de → a), `retiro` (socio, de; no es gasto, en Reparto se muestra "ya retiró / le queda"), `aportacion` (socio, a), `inicial` (saldo inicial; reinicia el saldo de esa cuenta desde su fecha; la Caja arranca en el fondo si no tiene), `ajuste` (botón Cuadrar: diferencia contra el saldo real).
- Reemplazó a "Dinero por cuenta" (CorteCaja). `cuentaResumen` sigue existiendo para el esperado del Cierre.

## Cierre del día (`CierreDia`, key `msp-ci4`)
- Lo hace el empleado después de las 7:30 pm. Cuenta efectivo por billetes (`DENOMS`) + monedas y TODO el inventario (`contables()`: productos cajas/sobres o piezas + vasos de palomitas) a ciegas.
- Esperado = `FONDO_CAJA` ($500) + efectivo que pasa por la caja (`efectivoEsperado`): ventas/envíos/mixtos en efectivo − gastos con `deCaja:true` − pagos a repartidores en efectivo − contra entrega que el repartidor aún no entrega + contra entrega de días anteriores entregada hoy. Gastos que paga un socio (`deCaja:false`, default para socios y siempre en fijos) y utilidades extra NO cuentan.
- Empleado ve solo: cuánto contó y cuánto entregar al socio (contado − fondo). Socios ven esperado, diferencia, inventario que no cuadró (valor a precio y a costo), y pueden: marcar revisado, "Ajustar inventario al conteo" (crea movimientos `type:"ajuste"`), o reabrir el día (borra el cierre).
- Día cerrado = no se pueden registrar ventas ni palomitas de esa fecha (prop `cerrados`). Inicio avisa si falta el cierre de ayer o hay cierres con diferencias sin revisar.
- `cuentaResumen(m,range,…)` es el cálculo por cuenta compartido por Corte y Cierre.

## Control contra robos (en Caja, solo socios)
- **Transferencias**: `transDe(s)` = parte de la venta por SPIN/MP/terminal (o la parte no-efectivo de un Mixto). Cada una se confirma con `sale.transConf` "si"/"no" (+ `transConfPor`, `transConfFecha`). Las de días cerrados se confirman dentro de su cierre (`TransRow`); las de días sin cierre en `TransferenciasPend`. En Vender se puede anotar `sale.transRef` (quién transfirió, opcional).
- **Efectivo recibido**: el socio confirma en el cierre cuánto le entregaron (`cierre.recibido`, `recibidoPor`). Si es menos que contado − fondo, el cierre queda "Algo no cuadra" y en Cuentas a Efectivo socios solo entra lo recibido.
- `estadoCierre(c,sales)`: "mal" (efectivo o inventario no cuadran, transferencia que no llegó, o recibió menos), "ok" (todo cuadra, transferencias confirmadas y efectivo recibido confirmado), "pendiente". Inicio avisa cierres no "ok" sin revisar y transferencias sin confirmar de días anteriores.
- **Conteo sorpresa** (`ConteoSorpresa`, key `msp-cs4`): los socios cuentan todo a ciegas cuando quieran; se compara contra el sistema y se puede ajustar (`aplicarConteo`, movimientos `ajuste`). No bloquea ventas.

## Candados de ventas
- Pago mixto tiene que sumar exacto (productos + envío del cliente).
- `sale.sinStock`: productos vendidos sin stock suficiente en sistema (se marca, no se bloquea).
- Borrar venta regresa productos/regalos al inventario y deja movimiento `type:"devolucion"`.
- Inventario incluye productos por pieza (Sex Shop) en el cargador y en `OtrosTable`.

## Otras pantallas
- Inicio: utilidad neta del mes (ventas − costo − gastos + ingresos extra, igual que Reparto), vendido, gastos, utilidad del año y gráfica de utilidad neta por mes.
- Reparto: semanal + gráfica por día + resumen mensual (la gráfica mensual vive en Inicio).
- Inventario: una sola forma de registrar mercancía (`guardarEntrada`, movimientos `entrada` con `cajas` y `sobres`), abrir cajas, tablas de stock (solo socios) e historial. Ya no hay conteo físico aquí (va en el Cierre) ni botón de resetear.
- Gastos: fijos, **Ingresos extra** (`IngresosExtra`, antes "Utilidad extra" del Corte; se guardan en `extras` con `via`), registrar gasto, gráfica por categoría (incluye categorías viejas) e historial.
- Vender: historial en tarjetas por día (socios eligen la fecha). Ventas nuevas guardan `hora`.
- Formas de pago: Efectivo, SPIN Marcel, SPIN Gustavo, Transferencia MP, Terminal MP, Mixto. "Tercero" se quitó (solo se muestra en ventas viejas).
- El producto genérico "Sobre individual" (`sob`) se eliminó: los sobres se venden por marca.

## Correr local
```
npm install
npm run dev
```
Antes de hacer push SIEMPRE correr `npm run build` y confirmar que compila.
- Local usa la base REAL. Para probar sin escribir nada: `VITE_NO_SAVE=1` en `.env.local` (solo aplica en `npm run dev`; `dbSave` no guarda). `.env.local` no se sube.

## Módulos actuales
- **Vender** (`NuevaVenta`, 2 pasos): paso 1 = `ClientePicker` (lista completa A-Z + buscador; primero los que empiezan con lo escrito) y productos por apartados (`GRUPOS`: Mieles, Gomitas y chocolates, Sex shop, Paquetes) con `VentaRow` (+/−, Caja/Sobre, lápiz de precio, utilidad por línea solo socios). Carrito `cart` con llaves `p|pid|caja`, `p|pid|sobre`, `k|pkgId`; precios a mano en `over`. Precio especial de cliente: `cl.prices[pid]` (caja), `cl.prices[pid+"_s"]` (sobre), `cl.pkgPrices[id]`; solo socios lo guardan en el perfil (casilla en el editor). Paso 2 = cortesías, envío, pago, nota y desglose de utilidad. Barra de total fija arriba del menú. Se pueden mezclar paquetes y productos en una venta.
- **Inventario**: cargador masivo (cajas + sobres), edición en línea por fila con historial de cambios.
- **Gastos**: registra de qué cuenta salió (Efectivo / SPIN Marcel / SPIN Gustavo) y se descuenta en el Corte de Caja.
- **Corte de Caja**: desglose por cuenta (ventas + transferencias mixtas + extras − gastos = neto). Pago "Mixto" se reparte entre cuentas y NO aparece como categoría aparte.
- **Envíos**: "cobro al cliente" y "costo del repartidor" separados, con ganancia/pérdida en tiempo real.
- **Utilidades Extra**: se suman a los totales por cuenta.
- **Palomitas** (pestaña 🍿): POS rápido para el local. 3 tamaños (Pequeño $20 / Mediano $35 / Grande $50), precios y costos editables guardados en `msp-pop4`. Cada cobro se guarda como venta normal en `sales` con `tipo:"palomitas"` y `clientId:""`, así entra solo en Corte, Reparto y Dashboard. Cada palomita descuenta un vaso de su tamaño (`popCfg[k].stock`, puede quedar negativo para evidenciar faltantes); se cargan en Inventario → Vasos de palomitas.
- **Gastos del local**: categorías en `EXP_CATS`; las de `FIXED_CATS` solo las ven los socios.
- **Cuentas del negocio** (`CUENTAS`): Efectivo, SPIN Marcel, SPIN Gustavo y Transferencia MP (cuenta Mercado Pago, sin comisión). Todas las listas de "con qué se pagó" usan `CUENTAS`/`CUENTA_LABEL`. En el Corte, Transferencia MP + Terminal MP (neto de comisión) = lo que entró a Mercado Pago.
- **Terminal Mercado Pago**: forma de pago "Terminal MP" (también como parte de un Mixto). Comisión `TERMINAL_FEE` = 3.5% (confirmar si MP cobra IVA encima). La comisión se guarda en `sale.comision` y se suma a `sale.cost`, así baja la utilidad en todos los reportes; en el Corte la tarjeta de Terminal resta la comisión.
- **Palomitas**: costo por pieza = `vaso` ($5 los tres tamaños) + `cost` (insumos, pendiente).
- **Envíos** (`EnvioForm` en Nueva venta + pestaña `Envios`):
  - Dos costos: cuota de la plataforma $1,000/semana (gasto fijo "Repartidor fijo") + cada viaje se le paga al repartidor a `ENVIO_TARIFA_KM` = $10/km.
  - Venta con envío guarda: `conEnvio`, `envio` (lo que paga el cliente), `costoEnvio` (lo que cobra el repartidor), `envioNeto` = costo − cliente (lo que absorbemos, va DENTRO de `cost`), `envioKm`, `envioPct` (100/50/0/otro), `repartidor`, `envioDir`, `envioStatus` (pendiente/salio/entregado + horas), `envioPagado`, `envioPagadoCon`, `envioPagadoFecha`.
  - `sale.total` sigue siendo solo productos. En el Corte, `envio` entra a la cuenta de la venta (en Mixto ya viene dentro del desglose) y el pago al repartidor sale de `envioPagadoCon` en la fecha `envioPagadoFecha`. El pago al repartidor NO se registra como gasto (ya está en `cost`): así no se cuenta doble.
  - Dos formas de cobro (`envCobro`): **transferencia/terminal** (el viaje queda "por pagar" al repartidor hasta marcarlo) o **efectivo contra entrega** (`envioContra`): el repartidor cobra productos + envío, se queda con `costoEnvio` (queda pagado en Efectivo ese día) y debe entregar `envioDebe` hasta que se marque `envioDineroRecibido`. El Corte avisa cuánto efectivo lo traen todavía los repartidores.
- **Cortesías** (`RegalosForm`, paso 2 de Vender): sobres que se regalan por gusto, opcionales, siempre por marca (`regalos={pid:qty}`). Cada uno cuesta `sobreCost(p)`, se suma a `sale.cost`, se guarda en `sale.regalos` [{pid,qty,costo}] / `sale.regaloCosto` y se descuenta de `stockSobres`.
- **Fecha de arranque** `INICIO_OPERACION` = 2026-10-01: Inicio, Corte y Reparto reciben `repSales/repExpenses/repExtras` (filtrados, SOLO LECTURA). Nunca pasar arreglos filtrados a componentes que hacen setSales/setExpenses/setExtras con el arreglo recibido, porque borrarían lo anterior.
- Palomitas: insumos default Pequeño $3, Mediano $4, Grande $6 (estimado de Marcel, lado alto). Solo se aplican si el costo guardado es 0.
- Equipo: 2 socios (Marcel, Gustavo) + 1 empleado usan la app.
- **Reparto de utilidades**: vista semanal (principal) y mensual, split 33% Marcel / 33% Gustavo / 34% Reinversión MSP, con gráficas de barras.
- **KPI**: tarjeta "Utilidad Neta del Mes" con borde verde/rojo.
- Chocolates (`rchv` Royal Choco VIP, `rhch` Rhino Choco, `ppch` Pink Pussycat Choco): caja de 12 sobres a $1,250, sobre a $200 (`listSobre`), costo caja $290 (Pink Pussycat Choco se agregó con el mismo costo, confirmar). Gomitas (`gom_m`, `gom_f`): caja de 6 piezas. El apartado "Gomitas y chocolates" se arma con `GOM_IDS` y en ese orden.
- Catálogo: columnas por producto `costSobre`, `listSobre`, precio sobre (editables). Pink Pussycat 12 sobres fue descontinuado (eliminado).

## Reglas duras (bugs que ya nos pasaron)
1. **No declarar variables duplicadas** (ej. `exForm`, `PAY_METHODS_LABEL`): rompen el build de Vercel.
2. **Nunca definir componentes dentro de otros componentes**: causa pantalla en blanco. Todos los componentes van como funciones top-level.
3. **La migración de productos solo pone costos default a productos NUEVOS** sin valor. Nunca sobreescribir costos que el usuario ya editó al cargar la página. Excepción: cuando Marcel manda costos nuevos se usa `COSTOS_ACT` con `ver` (se aplica una sola vez por producto, marcado con `costVer`).
   - Costos de caja al 2026-10-07: Black Horse, Royal Honey VIP, Hard Steel y Pink Pussycat 24 = $160 · chocolates (Royal Choco, Rhino Choco, Pink Pussycat Choco) = $250 · Royal Honey 12 = $100 · Platinum = $157 · Vitafer = $230. Pink Pussycat 12 NO se maneja.
4. **Costo de un sobre = `sobreCost(p)` = costo de la caja ÷ sobres** (ya no se usa `costSobre` escrito a mano). Precio de venta del sobre = `listSobre`. Nunca usar el costo de la caja para un sobre.
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
