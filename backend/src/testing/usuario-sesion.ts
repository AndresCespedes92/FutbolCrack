// Doble exclusivo de pruebas: AuthGuard consulta el modelo y los servicios usan la ficha simulada.
// No omite el guard ni hace conexiones; mantiene ambos consumidores sobre el mismo estado de prueba.
export function modeloUsuarioSesion(buscar: (id: string) => Promise<unknown>) {
  return {
    findById: (id: unknown) => ({
      select() {
        return this;
      },
      lean() {
        return this;
      },
      exec: () => buscar(String(id)),
    }),
  };
}
