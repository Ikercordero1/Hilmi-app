//En este archivo se manejan las rutas para obtener todas las citas y crear nuevas citas. Se reciben los datos del formulario, se guardan en la base de datos y se devuelve una respuesta al cliente. También se verifica que no haya conflictos de horarios para el mismo veterinario.

import { NextResponse } from "next/server";
import db from "../../../lib/db";

export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const [appointments] = await db.query(`
SELECT a.*, u.email as client_email
FROM appointments a
JOIN users u ON a.client_id = u.id
ORDER BY a.appointment_date, a.appointment_time
`);
    return NextResponse.json(appointments, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Error al obtener citas" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const {
      client_id,
      pet_name,
      owner_name,
      vet_name,
      appointment_date,
      appointment_time,
    } = await request.json();

    if (
      !client_id ||
      !pet_name ||
      !owner_name ||
      !vet_name ||
      !appointment_date ||
      !appointment_time
    ) {
      return NextResponse.json({ message: "Faltan datos" }, { status: 400 });
    }

    const [existing] = await db.query(
      "SELECT id FROM appointments WHERE appointment_date = ? AND appointment_time = ? AND vet_name = ?",
      [appointment_date, appointment_time, vet_name],
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { message: "Ese horario ya está ocupado" },
        { status: 409 },
      );
    }

    await db.query(
      "INSERT INTO appointments (client_id, pet_name, owner_name, vet_name, appointment_date, appointment_time) VALUES (?, ?, ?, ?, ?, ?)",
      [
        client_id,
        pet_name,
        owner_name,
        vet_name,
        appointment_date,
        appointment_time,
      ],
    );

    return NextResponse.json(
      { message: "Cita agendada con éxito" },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: "Error al crear cita" },
      { status: 500 },
    );
  }
}
