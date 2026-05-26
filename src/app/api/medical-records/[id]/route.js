//Endpoint para obtener, actualizar o eliminar un registro médico específico por su ID
import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function GET(request, { params }) {
  try {
    const { id } = await params;

    const [records] = await db.query(
      "SELECT * FROM medical_records WHERE id = ?",
      [id],
    );
    if (records.length === 0) {
      return NextResponse.json(
        { message: "Registro no encontrado" },
        { status: 404 },
      );
    }

    const [supplies] = await db.query(
      "SELECT * FROM medical_supplies WHERE record_id = ?",
      [id],
    );

    return NextResponse.json({ record: records[0], supplies });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al obtener registro" },
      { status: 500 },
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { vet_name, visit_date, diagnosis, treatment, notes, supplies } =
      await request.json();

    if (!visit_date || !diagnosis) {
      return NextResponse.json(
        { message: "Faltan datos obligatorios" },
        { status: 400 },
      );
    }

    await db.query(
      `UPDATE medical_records
       SET vet_name=?, visit_date=?, diagnosis=?, treatment=?, notes=?
       WHERE id=?`,
      [
        vet_name ?? null,
        visit_date,
        diagnosis,
        treatment ?? null,
        notes ?? null,
        id,
      ],
    );

    // Reemplazar insumos completamente
    if (Array.isArray(supplies)) {
      await db.query("DELETE FROM medical_supplies WHERE record_id = ?", [id]);

      const validSupplies = supplies.filter((s) => s.supply_name?.trim());
      if (validSupplies.length > 0) {
        const supplyValues = validSupplies.map((s) => [
          id,
          s.supply_name.trim(),
          parseFloat(s.quantity) || 1,
          s.unit ?? "",
        ]);
        await db.query(
          "INSERT INTO medical_supplies (record_id, supply_name, quantity, unit) VALUES ?",
          [supplyValues],
        );
      }
    }

    return NextResponse.json({ message: "Registro actualizado" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al actualizar registro" },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    // Los insumos se eliminan por CASCADE
    await db.query("DELETE FROM medical_records WHERE id = ?", [id]);
    return NextResponse.json({ message: "Registro eliminado" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al eliminar registro" },
      { status: 500 },
    );
  }
}
