//API para obtener, actualizar o eliminar una mascota por su ID. También incluye el historial médico completo con insumos asociados.
import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    // Obtener mascota
    const [pets] = await db.query("SELECT * FROM pets WHERE id = ?", [id]);
    if (pets.length === 0) {
      return NextResponse.json(
        { message: "Mascota no encontrada" },
        { status: 404 },
      );
    }

    //  Obtener registros médicos
    const [records] = await db.query(
      "SELECT * FROM medical_records WHERE pet_id = ? ORDER BY visit_date DESC",
      [id],
    );

    //  Para cada registro, obtener sus insumos por separado
    const recordsWithSupplies = await Promise.all(
      records.map(async (rec) => {
        const [supplies] = await db.query(
          "SELECT * FROM medical_supplies WHERE record_id = ?",
          [rec.id],
        );
        return { ...rec, supplies };
      }),
    );

    return NextResponse.json({ pet: pets[0], records: recordsWithSupplies });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al obtener historial" },
      { status: 500 },
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const {
      owner_name,
      owner_cedula,
      owner_phone,
      pet_name,
      species,
      breed,
      age,
      notes,
    } = await request.json();

    await db.query(
      `UPDATE pets SET owner_name=?, owner_cedula=?, owner_phone=?,
pet_name=?, species=?, breed=?, age=?, notes=? WHERE id=?`,
      [
        owner_name,
        owner_cedula,
        owner_phone,
        pet_name,
        species,
        breed,
        age,
        notes,
        id,
      ],
    );

    return NextResponse.json({ message: "Ficha actualizada" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al actualizar" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await db.query("DELETE FROM pets WHERE id = ?", [id]);
    return NextResponse.json({ message: "Mascota eliminada" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error al eliminar" }, { status: 500 });
  }
}
