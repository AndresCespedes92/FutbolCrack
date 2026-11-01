// Una query llega como texto. Solo convertir enteros decimales evita aceptar vacíos,
// fracciones, notación exponencial o arrays. Cada DTO define sus propios límites.
export function enteroDeQuery(valor: unknown): unknown {
  return typeof valor === 'string' && /^(0|[1-9]\d*)$/.test(valor)
    ? Number(valor)
    : valor;
}
