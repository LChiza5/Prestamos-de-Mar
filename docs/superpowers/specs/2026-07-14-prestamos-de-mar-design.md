# Préstamos de Mar — Diseño

## Contexto

Aplicación de control de préstamos informales para Oldemar (papá de un amigo cercano del
desarrollador), quien presta dinero y necesita llevar control de clientes, préstamos,
abonos e intereses. Debe funcionar principalmente en computadora y teléfono (tablet como
uso secundario), y seguir funcionando sin conexión a internet en zonas rurales.

El desarrollador ya construyó una app similar más simple ("Facturero — Kazate's Shoes",
React + Vite + Firebase) para sus propios papás. Ese proyecto sirve como referencia de
patrón de estructura (componentes/hooks/services/screens), pero su modelo de datos no
sirve para este caso: es un solo listado de deudas sin intereses, sin múltiples préstamos
por cliente, y con un hueco de seguridad (contraseñas en texto plano en el código para
una pantalla de "resumen").

### Privacidad

El proyecto de Firebase se aloja bajo la cuenta personal del desarrollador (decisión
explícita del cliente/desarrollador, en un proyecto de Firebase separado del de sus
papás — nunca se comparte infraestructura entre ambos). El desarrollador se compromete a
no revisar los datos reales de los clientes de Oldemar salvo que se necesite dar soporte
técnico ante un problema reportado. Esto se le comunica a Oldemar de antemano.

## Arquitectura

- **Frontend:** React + Vite, empaquetado como **PWA** (instalable en escritorio de
  teléfono/tablet/computadora vía navegador, sin publicar en tiendas de apps).
- **Backend/datos:** Firebase — Firestore (base de datos) + Firebase Auth (login).
- **Offline:** se activa la persistencia offline nativa de Firestore (cache en
  IndexedDB). La app puede leer datos cacheados y encolar escrituras (nuevos préstamos,
  abonos) sin conexión; Firestore sincroniza automáticamente al recuperar señal. No se
  construye ningún motor de sincronización manual.
- **Un solo usuario:** Oldemar es el único usuario del sistema. Login simple
  usuario/contraseña (se usa el mismo truco del proyecto anterior: el "usuario" se
  concatena a un dominio interno ficticio, ej. `oldemar@prestamosdemar.local`, para poder
  usar Firebase Auth con email/password sin que Oldemar necesite un correo real). La
  cuenta se crea una sola vez de forma manual (consola de Firebase o script de setup),
  no hay registro público.
- **Seguridad:** reglas de Firestore que solo permiten lectura/escritura a un usuario
  autenticado (el UID fijo de Oldemar). No se repite el patrón de contraseñas
  hardcodeadas del proyecto anterior.

## Modelo de datos (Firestore)

```
clients/{clientId}
  name: string
  rating: "green" | "yellow" | "red"   // calificación manual del cliente
  createdAt: timestamp

clients/{clientId}/loans/{loanId}
  principal: number          // monto original prestado, con decimales
  rate: 6 | 8 | 10            // % elegido manualmente al crear el préstamo
  remainingBalance: number    // capital pendiente; solo baja con abonos
  startDate: timestamp
  status: "active" | "paid"
  totalInterestEarned: number // acumulado de interés generado por este préstamo

clients/{clientId}/loans/{loanId}/payments/{paymentId}
  amount: number              // monto abonado
  interestPortion: number     // = amount * (rate / 100)
  principalPortion: number    // = amount - interestPortion
  date: timestamp
```

- Todos los montos se guardan y muestran **con decimales** (2 decimales, separador de
  miles al mostrar) para que no haya ambigüedad de lectura ("¿ese es un cero de más o
  son centavos?").
- El total de interés ganado global (para el dashboard) se calcula en el cliente
  sumando `totalInterestEarned` de todos los préstamos — no se mantiene un documento de
  agregado aparte, dado el volumen de datos esperado (un prestamista individual, decenas
  de clientes, no miles).
- `remainingBalance` y `totalInterestEarned` se actualizan de forma atómica (transacción
  de Firestore) al registrar un abono, para evitar inconsistencias si dos escrituras
  offline se sincronizan casi al mismo tiempo.

## Motor de intereses (confirmado con el cliente final)

Reglas, ya validadas explícitamente con ejemplos numéricos:

1. El capital de un préstamo **no crece solo por el paso del tiempo**. Se mantiene fijo
   hasta que se abona.
2. Cada abono se reparte siempre con la misma fórmula, sin importar cuántos días hayan
   pasado desde el último abono:
   - `interés = tasa% × monto_abonado`
   - `resto = monto_abonado − interés`
   - El `resto` reduce `remainingBalance`.
3. La tasa (6/8/10%) se define una sola vez al crear el préstamo, manualmente por
   Oldemar, y no cambia después.
4. Si un cliente tiene varios préstamos activos simultáneos, Oldemar elige explícitamente
   a cuál préstamo aplica cada abono (no hay reparto automático entre préstamos).
5. Un préstamo pasa a `status: "paid"` cuando `remainingBalance` llega a 0.

### Simplificación deliberada: "corte" sin lógica de negocio

En la conversación inicial se mencionó un "corte" (ej. cada 30 días) que en un principio
parecía afectar el cálculo de interés. Tras confirmar con ejemplos numéricos concretos,
se estableció que el corte **no altera la fórmula de reparto** — el interés siempre
sale del abono, nunca de los días transcurridos. Por lo tanto no se implementa un
mecanismo de corte automático ni tareas programadas. Como ayuda visual únicamente, cada
préstamo muestra "días desde el último abono" (dato informativo, sin lógica de negocio
detrás, solo un recordatorio para Oldemar).

## Pantallas y funcionalidades

1. **Login** — usuario/contraseña de Oldemar. Fondo con imagen temática de "Préstamos de
   Mar" (océano + billetes/monedas). Imagen lateral reutilizada del proyecto anterior
   (Toy Story, Legos, Hot Wheels).
2. **Dashboard** — resumen total: dinero prestado activo (suma de `remainingBalance` de
   préstamos activos) e interés total ganado (histórico).
3. **Clientes** — lista con búsqueda, alta de cliente nuevo (nombre + calificación de
   color), acceso al detalle.
4. **Detalle de cliente** — préstamos activos y pagados, calificación editable, botón
   para crear nuevo préstamo (monto + tasa), botón para registrar abono sobre un
   préstamo específico (con el reparto automático interés/capital ya calculado y
   mostrado antes de confirmar), historial de abonos por préstamo.
5. **Comprobante** — genera una tarjeta/imagen simple (nombre del cliente, deuda actual,
   interés) a partir de los datos ya cargados en pantalla (funciona offline, no requiere
   red). Oldemar la comparte manualmente (ej. WhatsApp) cuando él decida o cuando el
   cliente lo pida — no se envía nada automáticamente.
6. **Simulador de cuotas** — pantalla independiente, no lee ni escribe datos reales.
   Entradas: monto, tasa (6/8/10%), cuota mensual hipotética. Salida: cantidad de meses
   estimados para saldar la deuda y el interés total que se pagaría, aplicando la misma
   fórmula del motor de intereses mes a mes.

## Validación y manejo de errores

- Montos deben ser números positivos; se sanea texto libre (nombre de cliente) igual que
  en el proyecto anterior (se remueven caracteres como `<>/"'` antes de guardar).
- Un abono no puede exceder el `remainingBalance` del préstamo seleccionado.
- El simulador de cuotas rechaza cuota ≤ 0 (evita cálculos sin sentido; matemáticamente
  no hay riesgo de bucle infinito porque, al ser la tasa siempre menor al 100%, la
  porción que abona a capital siempre es positiva).
- Reglas de seguridad de Firestore rechazan cualquier lectura/escritura de un usuario
  que no sea el UID autorizado de Oldemar.

## Fuera de alcance

- Envío automático de comprobantes (se descartó la opción B a favor de compartir manual).
- Múltiples usuarios/roles (solo Oldemar usa el sistema).
- Corte/cierre de periodo automatizado (no afecta el cálculo, ver sección de
  simplificación).
- Generación de la imagen de fondo fotorrealista del login: se puede sustituir por una
  ilustración vectorial simple hecha a mano, o por una imagen generada con otra
  herramienta de IA de imágenes e integrada después.
