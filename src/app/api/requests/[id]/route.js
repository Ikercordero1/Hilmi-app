//Este archivo maneja las operaciones CRUD para solicitudes individuales (GET, PUT, DELETE)
import { NextResponse } from "next/server";
import db from "../../../../lib/db";

// GET — Obtener una solicitud por ID
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const [rows] = await db.query(
      `SELECT r.*, u.email as client_email
FROM appointment_requests r
JOIN users u ON r.client_id = u.id
WHERE r.id = ?`,
      [id],
    );
    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Solicitud no encontrada" },
        { status: 404 },
      );
    }
    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}

// PUT — Asistente aprueba o rechaza
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { status, rejection_reason } = await request.json();

    if (!["aprobada", "rechazada"].includes(status)) {
      return NextResponse.json({ message: "Estado inválido" }, { status: 400 });
    }

    // Obtener solicitud
    const [rows] = await db.query(
      "SELECT * FROM appointment_requests WHERE id = ?",
      [id],
    );
    if (rows.length === 0) {
      return NextResponse.json(
        { message: "Solicitud no encontrada" },
        { status: 404 },
      );
    }

    const req = rows[0];

    // Validar que no esté expirada
    if (req.status === "expirada") {
      return NextResponse.json(
        { message: "Esta solicitud ya expiró y no puede ser aprobada" },
        { status: 409 },
      );
    }

    // Validar que esté en_revision
    if (req.status !== "en_revision") {
      return NextResponse.json(
        {
          message: `No se puede procesar una solicitud en estado: ${req.status}`,
        },
        { status: 409 },
      );
    }

    // Validar ventana de 2 horas
    const now = new Date();
    const expires = new Date(req.expires_at);
    if (now > expires) {
      // Expirar y liberar
      await db.query(
        "UPDATE appointment_requests SET status = 'expirada' WHERE id = ?",
        [id],
      );
      return NextResponse.json(
        { message: "La solicitud expiró. El horario ha sido liberado." },
        { status: 409 },
      );
    }

    if (status === "aprobada") {
      // Crear cita confirmada
      await db.query(
        `INSERT INTO appointments
(client_id, pet_name, owner_name, vet_name, appointment_date, appointment_time)
VALUES (?, ?, ?, ?, ?, ?)`,
        [
          req.client_id,
          req.pet_name,
          req.owner_name,
          req.vet_name,
          req.requested_date,
          req.requested_time,
        ],
      );
    }

    await db.query(
      `UPDATE appointment_requests
SET status = ?, rejection_reason = ?, reviewed_at = NOW()
WHERE id = ?`,
      [status, rejection_reason ?? null, id],
    );

    return NextResponse.json({
      message:
        status === "aprobada"
          ? "Cita aprobada y confirmada"
          : "Solicitud rechazada",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al procesar solicitud" },
      { status: 500 },
    );
  }
}

// DELETE — Eliminar solicitud
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await db.query("DELETE FROM appointment_requests WHERE id = ?", [id]);
    return NextResponse.json({ message: "Solicitud eliminada" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error al eliminar" }, { status: 500 });
  }
}
