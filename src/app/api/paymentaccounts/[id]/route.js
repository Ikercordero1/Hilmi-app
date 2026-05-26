//Este código es para eliminar una cuenta de pago, no tiene validaciones
// adicionales porque no hay relaciones directas con otras tablas que puedan causar conflictos.
// Solo se elimina la cuenta si existe, y se maneja cualquier error que pueda ocurrir durante el proceso.

import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await db.query("DELETE FROM payment_accounts WHERE id = ?", [id]);
    return NextResponse.json({ message: "Cuenta eliminada" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al eliminar cuenta" },
      { status: 500 },
    );
  }
}
