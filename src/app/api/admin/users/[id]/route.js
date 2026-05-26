// Endpoint para actualizar rol o eliminar usuario por ID.
import { NextResponse } from "next/server";
import db from "../../../../../lib/db";

// PUT - Cambiar rol
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { role } = await request.json();

    if (!["user", "assistant", "admin"].includes(role)) {
      return NextResponse.json({ message: "Rol inválido" }, { status: 400 });
    }

    await db.query("UPDATE users SET role = ? WHERE id = ?", [role, id]);
    return NextResponse.json({ message: "Rol actualizado" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al actualizar rol" },
      { status: 500 },
    );
  }
}

// DELETE - Eliminar usuario
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await db.query("DELETE FROM users WHERE id = ?", [id]);
    return NextResponse.json({ message: "Usuario eliminado" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al eliminar usuario" },
      { status: 500 },
    );
  }
}
