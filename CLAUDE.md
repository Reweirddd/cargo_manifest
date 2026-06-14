# Plan de Carga — Isuzu FRR CL (Lima → Pauza)

## Contexto del proyecto
Software para optimizar la carga de un camión Isuzu FRR CL (carrocería de madera) que transporta
abarrotes y alimentos desde Villa María del Triunfo (Lima Sur) hasta Pauza (Ayacucho), ~900 km
por la Panamericana Sur, pasando por Chala y Chaparra. Viajes 2-4 veces al mes.

## Especificaciones del camión
- Dimensiones internas de carga: 7.00 m largo × 2.40 m ancho × 2.20 m alto (36.96 m³)
- Capacidad de peso: 11,000 kg (chasis reforzado; el valor de fábrica del FRR CL es 7,050 kg)
- Carrocería: espacio abierto, sin divisiones físicas → el sistema usa **secciones virtuales**
- Margen de seguridad recomendado: alertar sobre el 90-95% de peso o volumen

## Modelo de secciones (a lo largo del largo del camión)
- Sección 1: junto a la puerta trasera → primera entrega de la ruta (ej. Chala)
- Sección 2 y 3: secciones intermedias (paradas intermedias, ej. Chaparra, Puquio)
- Sección 4: junto a la cabina → última entrega (Pauza)
- Cada sección tiene 3 capas: piso, medio, superior

## Categorías de carga y reglas de apilado
- **base** (sacos de arroz/azúcar 25-50kg): siempre en el piso, distribuidos para balancear
  el peso entre secciones/ejes
- **medio** (cajas de aceite Primor/La Patrona, lejía Clorox/Sapolio/Pandita, abarrotes varios):
  capa media, sobre la base
- **frágil** (huevos, gaseosas): siempre en la capa superior, sin nada encima ni debajo de otra
  carga pesada
- **aves vivas** (jaulas/jabas de pollos, pollitos BB): requieren ventilación, van en capa
  superior, sin nada apilado encima ni debajo

## Viaje de retorno (pendiente de desarrollar)
De regreso (Pauza → Lima) a veces se transporta ganado o jaulas/jabas de pollo (vacías o con
aves). Requiere una configuración de carga distinta a la de ida — pendiente de definir reglas
específicas (peso por cabeza de ganado, distribución de jaulas vacías, etc.)

## Estado actual
Prototipo funcional en React + Vite + Tailwind (`src/App.jsx`) con datos de EJEMPLO:
- Visualización tipo grid (4 secciones × 3 capas) con productos de ejemplo
- Cálculo automático de peso y volumen total vs. capacidad
- Gráfico de distribución de peso por sección
- Verificaciones automáticas (reglas de apilado, márgenes de seguridad)
- Desplegado vía Netlify (conectado a este repo de GitHub)

## Próximos pasos / objetivos
1. Reemplazar los datos de ejemplo con el **catálogo real de productos** (nombre, peso unitario,
   dimensiones/volumen, categoría, restricciones de apilado) — idealmente como una lista
   editable/persistente, no hardcodeada
2. Agregar una **visualización 3D** del camión y la carga (Three.js / React Three Fiber),
   adicional o en lugar del grid 2D actual
3. Permitir ingresar una carga nueva (lista de productos + cantidades) y que el sistema
   sugiera automáticamente la distribución óptima por sección/capa
4. Agregar configuración para el viaje de retorno (ganado / jaulas de pollo)
5. Mantener siempre visibles: % de peso usado, % de volumen usado, y alertas si se excede
   el margen de seguridad o se rompe alguna regla de apilado (frágil con peso encima, aves
   sin ventilación, etc.)
