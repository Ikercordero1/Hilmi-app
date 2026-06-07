import { NextResponse } from "next/server";
import db from "../../../lib/db";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const pet_id           = parseInt(formData.get("pet_id"));
    const name             = formData.get("name")?.trim();
    const application_date = formData.get("application_date");

    if (!pet_id || !name || !application_date) {
      return NextResponse.json({ error: "Datos incompletos" }, { status: 400 });
    }

    // Insertamos en medical_records
    // vet_name será 'Reporte de Cliente', diagnosis será el nombre de la vacuna
    const [result] = await db.query(
      `INSERT INTO medical_records (pet_id, vet_name, visit_date, diagnosis, treatment, notes)
       VALUES (?, 'Reporte de Cliente', ?, ?, 'Registro de Vacunación', 'Autodeclarada')`,
      [pet_id, application_date, `Vacuna: ${name}`]
    );

    return NextResponse.json({
      id: result.insertId,
      name: `Vacuna: ${name}`,
      application_date,
      note: "Autodeclarada",
    });
    
  } catch (error) {
    console.error("[POST /api/vaccines]", error);
    return NextResponse.json(
      { error: "Error al guardar el registro en la base de datos" },
      { status: 500 }
    );
  }
}