import { NextResponse } from "next/server";
import db from "../../../../lib/db";

// GET 
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const [rows] = await db.query("SELECT * FROM pets WHERE id = ?", [id]);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Mascota no encontrada" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("[GET /api/pets/[id]]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error al obtener mascota",
        error: error.message,
      },
      { status: 500 },
    );
  }
}

// PUT 
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      pet_name,
      species,
      breed,
      age,
      owner_name,
      owner_cedula,
      owner_phone,
      notes,
    } = body;

    if (!pet_name || !species || !owner_name || !owner_cedula) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Faltan campos obligatorios: pet_name, species, owner_name, owner_cedula",
        },
        { status: 400 },
      );
    }

    const [existing] = await db.query("SELECT id FROM pets WHERE id = ?", [id]);
    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: "Mascota no encontrada" },
        { status: 404 },
      );
    }

    await db.query(
      `UPDATE pets SET
pet_name = ?,
species = ?,
breed = ?,
age = ?,
owner_name = ?,
owner_cedula = ?,
owner_phone = ?,
notes = ?
WHERE id = ?`,
      [
        pet_name,
        species,
        breed || null,
        age || null,
        owner_name,
        owner_cedula,
        owner_phone || null,
        notes || null,
        id,
      ],
    );

    return NextResponse.json({ success: true, message: "Mascota actualizada" });
  } catch (error) {
    console.error("[PUT /api/pets/[id]]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error al actualizar mascota",
        error: error.message,
      },
      { status: 500 },
    );
  }
}

// DELETE 
export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    const [existing] = await db.query("SELECT id FROM pets WHERE id = ?", [id]);
    if (existing.length === 0) {
      return NextResponse.json(
        { success: false, message: "Mascota no encontrada" },
        { status: 404 },
      );
    }

    await db.query("DELETE FROM pets WHERE id = ?", [id]);

    return NextResponse.json({ success: true, message: "Mascota eliminada" });
  } catch (error) {
    console.error("[DELETE /api/pets/[id]]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error al eliminar mascota",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
