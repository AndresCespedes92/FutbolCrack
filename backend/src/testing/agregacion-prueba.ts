// Intérprete limitado EXCLUSIVO de tests. Ejecuta etapas genéricas sobre fixtures independientes.
// No sustituye la verificación futura contra MongoDB real (índices/plan de ejecución/rendimiento).
export function ejecutarPipeline(
  filas: any[],
  etapas: any[],
  colecciones: Record<string, any[]> = {},
): any[] {
  const campo = (doc: any, ruta: string) =>
    ruta.split('.').reduce((valor, clave) => valor?.[clave], doc);
  const valor = (doc: any, expresion: any): any => {
    if (typeof expresion === 'string' && expresion.startsWith('$'))
      return campo(doc, expresion.slice(1));
    if (expresion?.$ifNull)
      return (
        valor(doc, expresion.$ifNull[0]) ?? valor(doc, expresion.$ifNull[1])
      );
    if (expresion?.$size) return valor(doc, expresion.$size).length;
    if (expresion?.$in)
      return valor(doc, expresion.$in[1]).some(
        (v: any) => String(v) === String(valor(doc, expresion.$in[0])),
      );
    if (expresion?.$dateToString)
      return new Date(
        valor(doc, expresion.$dateToString.date).getTime() - 3 * 3600000,
      )
        .toISOString()
        .slice(0, 10);
    return expresion;
  };
  const coincide = (doc: any, filtro: any) =>
    Object.entries(filtro).every(([clave, esperado]: [string, any]) => {
      const actual = campo(doc, clave);
      if (
        esperado &&
        typeof esperado === 'object' &&
        !(esperado instanceof Date) &&
        !esperado._bsontype
      ) {
        return Object.entries(esperado).every(
          ([operador, limite]: [string, any]) => {
            if (operador === '$ne') return String(actual) !== String(limite);
            if (operador === '$gte') return actual >= limite;
            if (operador === '$lt') return actual < limite;
            throw new Error('Operador no soportado: ' + operador);
          },
        );
      }
      return String(actual) === String(esperado);
    });
  let datos = filas.map((doc) => ({ ...doc }));
  for (const etapa of etapas) {
    if (etapa.$match)
      datos = datos.filter((doc) => coincide(doc, etapa.$match));
    else if (etapa.$lookup) {
      const l = etapa.$lookup;
      datos = datos.map((doc) => ({
        ...doc,
        [l.as]: (colecciones[l.from] ?? []).filter(
          (otro) =>
            String(campo(otro, l.foreignField)) ===
            String(campo(doc, l.localField)),
        ),
      }));
    } else if (etapa.$unwind) {
      const clave = etapa.$unwind.slice(1);
      datos = datos.flatMap((doc) =>
        (doc[clave] ?? []).map((v: any) => ({ ...doc, [clave]: v })),
      );
    } else if (etapa.$group) {
      const grupos = new Map<string, any>();
      for (const doc of datos) {
        const id = valor(doc, etapa.$group._id),
          llave = String(id);
        const grupo = grupos.get(llave) ?? { _id: id };
        for (const [clave, acum] of Object.entries(etapa.$group) as [
          string,
          any,
        ][]) {
          if (clave === '_id') continue;
          if ('$sum' in acum)
            grupo[clave] = (grupo[clave] ?? 0) + valor(doc, acum.$sum);
          else if ('$first' in acum && !(clave in grupo))
            grupo[clave] = valor(doc, acum.$first);
          else if (!('$first' in acum))
            throw new Error('Acumulador no soportado');
        }
        grupos.set(llave, grupo);
      }
      datos = [...grupos.values()];
    } else if (etapa.$sort) {
      datos.sort((a, b) => {
        for (const [clave, sentido] of Object.entries(etapa.$sort) as [
          string,
          number,
        ][]) {
          const x = campo(a, clave),
            y = campo(b, clave);
          if (String(x) !== String(y)) return (x > y ? 1 : -1) * sentido;
        }
        return 0;
      });
    } else if (etapa.$project) {
      const inclusion = Object.values(etapa.$project).some((v) => v !== 0);
      datos = datos.map((doc) => {
        const salida = inclusion ? ({} as any) : { ...doc };
        for (const [clave, exp] of Object.entries(etapa.$project)) {
          if (exp === 0) delete salida[clave];
          else salida[clave] = exp === 1 ? doc[clave] : valor(doc, exp);
        }
        return salida;
      });
    } else if (etapa.$count)
      datos = datos.length ? [{ [etapa.$count]: datos.length }] : [];
    else if (etapa.$facet)
      datos = [
        Object.fromEntries(
          Object.entries(etapa.$facet).map(([clave, etapas]) => [
            clave,
            ejecutarPipeline(datos, etapas as any[], colecciones),
          ]),
        ),
      ];
    else if (etapa.$skip !== undefined) datos = datos.slice(etapa.$skip);
    else if (etapa.$limit !== undefined) datos = datos.slice(0, etapa.$limit);
    else if (etapa.$set)
      datos = datos.map((doc) => ({
        ...doc,
        ...Object.fromEntries(
          Object.entries(etapa.$set).map(([clave, exp]) => [
            clave,
            valor(doc, exp),
          ]),
        ),
      }));
    else throw new Error('Etapa no soportada: ' + Object.keys(etapa)[0]);
  }
  return datos;
}
