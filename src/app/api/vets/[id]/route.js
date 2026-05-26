//Este código es para eliminar un veterinario, pero antes de eliminarlo se verifica si
// tiene citas activas. Si el veterinario tiene citas, no se permite eliminarlo y se devuelve un error 409. Si no tiene citas, se procede a eliminarlo normalmente. Cualquier error durante el proceso se maneja con un error 500

import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const [appts] = await db.query(
      "SELECT id FROM appointments WHERE vet_name = (SELECT name FROM vets WHERE id = ?) LIMIT 1",
      [id],
    );

    if (appts.length > 0) {
      return NextResponse.json(
        { message: "Este veterinario tiene citas activas" },
        { status: 409 },
      );
    }

    await db.query("DELETE FROM vets WHERE id = ?", [id]);
    return NextResponse.json({ message: "Veterinario eliminado" });
  } catch (error) {
    return NextResponse.json(
      { message: "Error al eliminar veterinario" },
      { status: 500 },
    );
  }
}
