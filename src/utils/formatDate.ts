   export const formatDate = (dateString: string) => {
    if (!dateString) return "";

    // Evitar desfase de un día por huso horario cuando recibimos YYYY-MM-DD
    // new Date('YYYY-MM-DD') se interpreta en UTC y puede restar horas -> día anterior en América/Caracas
    const isoOnlyDate = /^\d{4}-\d{2}-\d{2}$/;
    let date: Date;
    if (isoOnlyDate.test(dateString)) {
      const [y, m, d] = dateString.split("-").map(Number);
      // Construir fecha en hora local
      date = new Date(y, (m as number) - 1, d as number);
    } else {
      date = new Date(dateString);
    }

    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }