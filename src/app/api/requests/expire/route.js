//Este archivo maneja la expiración automática de solicitudes vencidas.
// Se llama periódicamente (ej. cada hora) para actualizar el estado de las solicitudes que
// han pasado su fecha de expiración.
import { NextResponse } from "next/server";
import db from "../../../../lib/db";

// POST — Llamado periódicamente para expirar solicitudes vencidas
export async function POST() {
  try {
    const [result] = await db.query(
      `UPDATE appointment_requests
SET status = 'expirada'
WHERE status IN ('pendiente_pago', 'en_revision')
AND expires_at <= NOW()`,
    );

    return NextResponse.json({
      message: "Expiración ejecutada",
      expired: result.affectedRows,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error en expiración" },
      { status: 500 },
    );
  }
}
