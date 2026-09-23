# Investigación: obligaciones colombianas de la tirilla comercial no fiscal

> Alcance: esta síntesis usa exclusivamente el paquete de evidencia primaria curado para esta investigación. Aporta insumos para la decisión, pero no resuelve ni cierra el ticket de decisión de GitHub.

## Pregunta

¿Qué puede incluir y comunicar la primera versión del POS mediante una tirilla comercial no fiscal en Colombia, y qué límites deben mantenerse frente a las obligaciones del sistema de facturación de la DIAN?

## Hallazgos respaldados

### Derecho a constancia de la operación

La Ley 1480 de 2011 reconoce el derecho de la persona consumidora a exigir constancia de cada operación de consumo. La factura o su equivalente puede cumplir esa función, pero su presentación no es condición para ejercer los derechos previstos por esa ley. La misma ley exige que proveedores y productores suministren información clara, veraz, suficiente, oportuna, verificable, comprensible, precisa e idónea sobre los productos ofrecidos. [1]

### Límite entre la tirilla comercial y el documento fiscal

**Límite crítico: una tirilla comercial puede servir como evidencia o constancia de una transacción para la persona consumidora, pero no es una factura fiscal ni un documento equivalente de la DIAN. Excluir la integración DIAN del POS no elimina una obligación fiscal separada que pudiera corresponder al comercio.** [1][2][4]

Una constancia comercial no se convierte por sí sola en factura de venta ni en documento equivalente fiscal. Para los sujetos obligados a facturar o a expedir documento equivalente, la DIAN recuerda la obligación de expedir factura electrónica o documentos equivalentes electrónicos; la expedición física se contempla únicamente ante los inconvenientes tecnológicos regulados para el sistema fiscal. [2]

El Documento Equivalente Electrónico (DEE) tiquete de máquina registradora con sistema P.O.S. pertenece a ese sistema fiscal. Sus requisitos —incluida la identificación del adquirente y el detalle de bienes o servicios— no constituyen una lista de requisitos para una tirilla comercial declarada no fiscal. [4]

### Datos de la persona adquirente

La regulación citada sobre factura electrónica y DEE prevé datos específicos cuando el adquirente solicita que el documento sea expedido a su nombre. Cuando no lo solicita, la fuente indica que no corresponde pedir esos datos para ese supuesto fiscal. Esta regla no demuestra por sí sola qué datos debe solicitar una constancia comercial separada; sí impide tratar los campos fiscales como requisitos automáticos de la tirilla no fiscal. [3]

### Contenido de una constancia comercial separada

La evidencia no identifica una lista legal cerrada para el contenido obligatorio de una tirilla comercial separada y no fiscal. Para fines de producto, puede incluirse evidencia operativa que identifique al comercio y a la operación, fecha y hora, artículos, cantidades, importes, total, medios de pago y estado. Esta es una recomendación de trazabilidad e información clara para el producto, no una afirmación de suficiencia legal completa. [1]

## Implicaciones para la primera versión del POS

1. **Separar los conceptos en la interfaz y en el flujo operativo.** La salida debe identificarse como `Tirilla comercial / constancia de operación` e indicar de forma visible que no es factura ni documento equivalente fiscal de la DIAN. [1][2][4]
2. **Emitir una constancia útil para la operación.** La primera versión puede mostrar la identificación del comercio y de la venta, fecha y hora, líneas de artículos con cantidades e importes, total, medio de pago y estado de la operación. Esta selección es una recomendación de producto y no reemplaza una validación jurídica sobre contenido obligatorio. [1]
3. **Mantener un flujo fiscal separado.** Si el comercio está obligado a facturar o expedir documento equivalente, debe existir un proceso externo confirmado para cumplir esa obligación; la exclusión de integración DIAN del POS no sustituye ese proceso. [2]
4. **No equiparar el modo sin conexión del POS con la excepción fiscal por inconveniente tecnológico.** La evidencia solo describe esa excepción dentro del sistema DIAN regulado. [2]
5. **No trasladar automáticamente la captura de datos personales del documento fiscal a la tirilla comercial.** Cualquier dato personal adicional debe definirse para el flujo comercial separado y confirmarse con asesoría competente. [3]

## Preguntas sin resolver y confirmación profesional

| Pregunta | Motivo de confirmación |
| --- | --- |
| ¿La tienda concreta está obligada a facturar o a expedir algún documento equivalente, y cuál? | La evidencia no determina la condición tributaria ni la operación específica de la tienda. |
| ¿Qué documento fiscal emite actualmente el comercio y cómo se enlazará con cada venta del POS? | La exclusión de integración DIAN no elimina una eventual obligación fiscal separada. [2] |
| ¿Existe una regla sectorial aplicable a los productos o a la operación de la tienda? | Las fuentes revisadas no verifican reglas sectoriales especiales. |
| ¿Hay requisitos legales adicionales para una constancia comercial no fiscal? | Las fuentes no establecen una lista cerrada de contenido obligatorio para esa constancia. |
| ¿Cuándo podría aplicar una contingencia fiscal por inconveniente tecnológico? | La fuente menciona la excepción en el sistema fiscal, pero no confirma su aplicación a la operación concreta. [2] |

Antes de cerrar el alcance fiscal o de comunicar cumplimiento regulatorio, corresponde confirmar estas preguntas con un contador o asesor tributario competente. Este documento no constituye asesoría legal ni tributaria.

## Limitaciones de la evidencia

- El paquete no establece la obligación tributaria concreta de la tienda ni el documento fiscal que le corresponde.
- No se verificaron reglas sectoriales aplicables a los productos concretos de la tienda.
- No se identificó una lista legal cerrada para una constancia comercial separada y no fiscal.
- Las implicaciones de producto distinguen recomendaciones operativas de requisitos demostrados por las fuentes.

## Fuentes primarias

[1] **Publicador:** Congreso de Colombia (texto consultado en la compilación jurídica de la DIAN). **Título:** *Ley 1480 de 2011*, artículos 23 y 27. **URL:** <https://normograma.dian.gov.co/dian/compilacion/docs/ley_1480_2011.htm>. **Fecha de acceso:** 2026-09-23.

[2] **Publicador:** Dirección de Impuestos y Aduanas Nacionales (DIAN). **Título:** *Concepto 20900 de 2024*. **URL:** <https://normograma.dian.gov.co/dian/compilacion/docs/oficio_dian_20900_2024.htm>. **Fecha de acceso:** 2026-09-23.

[3] **Publicador:** Dirección de Impuestos y Aduanas Nacionales (DIAN). **Título:** *Resolución 000202 de 2025* (compilación jurídica), artículo 69 incorporado/modificado. **URL:** <https://normograma.dian.gov.co/dian/compilacion/docs/resolucion_dian_0202_2025.htm>. **Fecha de acceso:** 2026-09-23.

[4] **Publicador:** Dirección de Impuestos y Aduanas Nacionales (DIAN). **Título:** *Documento Equivalente Electrónico* (micrositio). **URL:** <https://micrositios.dian.gov.co/sistema-de-facturacion-electronica/documento-equivalente-electronico/>. **Fecha de acceso:** 2026-09-23.
