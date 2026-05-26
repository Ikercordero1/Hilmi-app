// Api para manejar veterinarios (GET para listar, POST para crear).

import { NextResponse } from "next/server";
import db from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [rows] = await db.query(
      "SELECT id, name FROM vets ORDER BY created_at ASC",
    );
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { message: "Error al obtener veterinarios" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const { name } = await request.json();

    if (!name?.trim()) {
      return NextResponse.json(
        { message: "El nombre es requerido" },
        { status: 400 },
      );
    }

    const [result] = await db.query("INSERT INTO vets (name) VALUES (?)", [
      name.trim(),
    ]);

    return NextResponse.json(
      { id: result.insertId, name: name.trim() },
      { status: 201 },
    );
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { message: "Ya existe un veterinario con ese nombre" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      { message: "Error al crear veterinario" },
      { status: 500 },
    );
  }
}
