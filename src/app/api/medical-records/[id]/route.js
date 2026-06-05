import { NextResponse } from "next/server";
import db from "../../../../lib/db";

// GET /api/medical-records/[id]
export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const [rows] = await db.query(
      `SELECT
mr.id,
mr.visit_date,
mr.diagnosis,
mr.treatment,
mr.notes,
mr.vet_name,
mr.created_at,

p.id AS pet_id,
p.pet_name,
p.species,
p.breed,
p.age,
p.owner_name,
p.owner_cedula,
p.owner_phone

FROM medical_records mr
LEFT JOIN pets p ON mr.pet_id = p.id
WHERE mr.id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Registro no encontrado" },
        { status: 404 },
      );
    }

    const [supplies] = await db.query(
      `SELECT
rs.inventory_id,
rs.quantity_used,
i.name AS supply_name,
i.unit,
i.category,
i.quantity AS current_stock
FROM record_supplies rs
LEFT JOIN inventory i ON rs.inventory_id = i.id
WHERE rs.record_id = ?`,
      [id],
    );

    return NextResponse.json({
      success: true,
      data: { ...rows[0], supplies },
    });
  } catch (error) {
    console.error("[GET /api/medical-records/[id]]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error al obtener registro",
        error: error.message,
      },
      { status: 500 },
    );
  }
}

// PUT /api/medical-records/[id]
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { visit_date, diagnosis, treatment, notes, vet_name } = body;

    const [existing] = await db.query(
      "SELECT id FROM medical_records WHERE id = ?",
      [id],
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: "Registro no encontrado" },
        { status: 404 },
      );
    }

    await db.query(
      `UPDATE medical_records SET
visit_date = COALESCE(?, visit_date),
diagnosis = COALESCE(?, diagnosis),
treatment = COALESCE(?, treatment),
notes = COALESCE(?, notes),
vet_name = COALESCE(?, vet_name)
WHERE id = ?`,
      [visit_date, diagnosis, treatment, notes, vet_name, id],
    );

    return NextResponse.json({
      success: true,
      message: "Registro actualizado",
    });
  } catch (error) {
    console.error("[PUT /api/medical-records/[id]]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error al actualizar registro",
        error: error.message,
      },
      { status: 500 },
    );
  }
}

// DELETE /api/medical-records/[id]
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const [existing] = await db.query(
      "SELECT id FROM medical_records WHERE id = ?",
      [id],
    );

    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: "Registro no encontrado" },
        { status: 404 },
      );
    }

    await db.query("DELETE FROM record_supplies WHERE record_id = ?", [id]);
    await db.query("DELETE FROM medical_records WHERE id = ?", [id]);

    return NextResponse.json({ success: true, message: "Registro eliminado" });
  } catch (error) {
    console.error("[DELETE /api/medical-records/[id]]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error al eliminar registro",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
