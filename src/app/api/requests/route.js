//Este archivo maneja las operaciones relacionadas con las solicitudes de citas 
// (GET para listar, POST para crear nuevas solicitudes en el calendario).
import { NextResponse } from "next/server";
import db from "../../../lib/db";

// GET — Obtener solicitudes (con filtro por status opcional)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    // Primero expirar las que corresponda
    await expireOldRequests();

    let query = `
SELECT r.*, u.email as client_email
FROM appointment_requests r
JOIN users u ON r.client_id = u.id
`;
    const params = [];

    if (status) {
      query += " WHERE r.status = ?";
      params.push(status);
    }

    query += " ORDER BY r.created_at DESC";

    const [rows] = await db.query(query, params);
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al obtener solicitudes" },
      { status: 500 },
    );
  }
}

// POST — Paciente crea solicitud (bloqueo temporal)
export async function POST(request) {
  try {
    const {
      client_id,
      owner_name,
      cedula,
      phone,
      pet_name,
      pet_species,
      pet_breed,
      pet_age,
      reason,
      vet_name,
      requested_date,
      requested_time,
    } = await request.json();

    // Validar campos obligatorios
    if (
      !client_id ||
      !owner_name ||
      !cedula ||
      !phone ||
      !pet_name ||
      !pet_species ||
      !vet_name ||
      !requested_date ||
      !requested_time
    ) {
      return NextResponse.json(
        { message: "Faltan datos obligatorios" },
        { status: 400 },
      );
    }

    // Expirar viejas antes de validar
    await expireOldRequests();

    // Verificar que no haya cita confirmada en ese slot
    const [existingAppt] = await db.query(
      `SELECT id FROM appointments
WHERE vet_name = ? AND appointment_date = ? AND appointment_time = ?`,
      [vet_name, requested_date, requested_time],
    );
    if (existingAppt.length > 0) {
      return NextResponse.json(
        { message: "Ese horario ya tiene una cita confirmada" },
        { status: 409 },
      );
    }

    // Verificar que no haya solicitud activa (pendiente_pago o en_revision)
    const [existingReq] = await db.query(
      `SELECT id FROM appointment_requests
WHERE vet_name = ? AND requested_date = ?
AND requested_time = ?
AND status IN ('pendiente_pago', 'en_revision')`,
      [vet_name, requested_date, requested_time],
    );
    if (existingReq.length > 0) {
      return NextResponse.json(
        { message: "Ese horario está bloqueado temporalmente" },
        { status: 409 },
      );
    }

    // Calcular expiración solo para enviarlo al temporizador del frontend
    const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000);

    // En la inserción, usamos DATE_ADD(NOW(), INTERVAL 2 HOUR) para la base de datos
    const [result] = await db.query(
      `INSERT INTO appointment_requests
(client_id, owner_name, cedula, phone,
pet_name, pet_species, pet_breed, pet_age, reason,
vet_name, requested_date, requested_time,
status, expires_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendiente_pago', DATE_ADD(NOW(), INTERVAL 2 HOUR))`,
      [
        client_id,
        owner_name,
        cedula,
        phone,
        pet_name,
        pet_species,
        pet_breed,
        pet_age,
        reason,
        vet_name,
        requested_date,
        requested_time,
      ],
    );

    return NextResponse.json(
      {
        message:
          "Horario bloqueado temporalmente. Tienes 2 horas para completar el pago.",
        id: result.insertId,
        expires_at: expiresAt.toISOString(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al crear solicitud" },
      { status: 500 },
    );
  }
}

// Función interna para expirar solicitudes vencidas
async function expireOldRequests() {
  await db.query(
    `UPDATE appointment_requests
SET status = 'expirada'
WHERE status IN ('pendiente_pago', 'en_revision')
AND expires_at <= NOW()`,
  );
}
