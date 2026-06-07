import { NextResponse } from "next/server";
import db from "../../../lib/db";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const cedulaRaw = searchParams.get("cedula");

  if (!cedulaRaw) {
    return NextResponse.json({ error: "Cédula requerida" }, { status: 400 });
  }

  // === FILTRO DE NORMALIZACIÓN PARA LA CÉDULA ===
  // 1. Pasamos a minúsculas y eliminamos espacios, puntos (.) y guiones (-)
  let cedula = cedulaRaw.toLowerCase().replace(/[\s\.\-]/g, "");

  // 2. Si el cliente solo introdujo números (ej: "30849008"), le agregamos la 'v' al inicio
  if (/^\d+$/.test(cedula)) {
    cedula = "v" + cedula;
  }
  // ==============================================

  try {
    // La consulta se mantiene limpia y tradicional
    const [rows] = await db.query(
      `SELECT 
        p.id AS pet_id, 
        p.pet_name, 
        p.species, 
        p.breed, 
        p.age, 
        p.owner_name, 
        p.owner_cedula,
        mr.id AS record_id, 
        mr.diagnosis, 
        mr.visit_date, 
        mr.notes AS record_notes
       FROM pets p
       LEFT JOIN medical_records mr ON mr.pet_id = p.id
       WHERE p.owner_cedula = ?
       ORDER BY p.pet_name ASC, mr.visit_date DESC`,
      [cedula], // Aquí va la cédula ya formateada como "v30849008"
    );

    if (!rows.length) {
      return NextResponse.json({ pets: [] });
    }

    // Agrupamos las mascotas y sus historiales usando JavaScript
    const petsMap = {};

    rows.forEach((row) => {
      if (!petsMap[row.pet_id]) {
        petsMap[row.pet_id] = {
          id: row.pet_id,
          pet_name: row.pet_name,
          species: row.species,
          breed: row.breed,
          age: row.age,
          owner_name: row.owner_name,
          owner_cedula: row.owner_cedula,
          vaccines: [],
        };
      }

      if (row.record_id) {
        const fechaFormateada = row.visit_date
          ? new Date(row.visit_date).toISOString().split("T")[0]
          : null;

        petsMap[row.pet_id].vaccines.push({
          id: row.record_id,
          name: row.diagnosis,
          application_date: fechaFormateada,
          note: row.record_notes,
        });
      }
    });

    const result = Object.values(petsMap);
    return NextResponse.json({ pets: result });
  } catch (error) {
    console.error("[GET /api/client-pets]", error);
    return NextResponse.json(
      { error: "Error interno al procesar el historial en el servidor" },
      { status: 500 },
    );
  }
}
