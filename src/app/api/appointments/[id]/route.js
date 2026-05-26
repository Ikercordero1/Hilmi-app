//Este archivo maneja las rutas para editar y eliminar citas. Se reciben los datos del formulario, se actualizan o 
// eliminan en la base de datos y se devuelve una respuesta al cliente.

import { NextResponse } from "next/server";
import db from "../../../../lib/db";

export async function PUT(request, { params }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    console.log("Backend PUT - ID recibido:", id);

    const { pet_name, owner_name } = await request.json();

    await db.query(
      "UPDATE appointments SET pet_name = ?, owner_name = ? WHERE id = ?",
      [pet_name, owner_name, id],
    );

    return NextResponse.json({ message: "Cita actualizada" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const resolvedParams = await params;
    const id = resolvedParams.id;

    console.log("Backend DELETE - ID recibido:", id);

    const [result] = await db.query("DELETE FROM appointments WHERE id = ?", [
      id,
    ]);

    console.log("Filas afectadas:", result.affectedRows);

    return NextResponse.json({ message: "Cita eliminada" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error" }, { status: 500 });
  }
}
