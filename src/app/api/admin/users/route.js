
//En este archivo se manejan las rutas para la gestión de usuarios por parte del admin.
import { NextResponse } from "next/server";
import db from "../../../../lib/db";
import bcrypt from "bcryptjs";

// GET - Listar todos los usuarios
export async function GET() {
  try {
    const [rows] = await db.query(
      "SELECT id, email, role, created_at FROM users ORDER BY created_at DESC",
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al obtener usuarios" },
      { status: 500 },
    );
  }
}

// POST - Admin crea usuario con rol elegido
export async function POST(request) {
  try {
    const { email, password, role } = await request.json();

    if (!email || !password || !role) {
      return NextResponse.json({ message: "Faltan datos" }, { status: 400 });
    }

    if (!["user", "assistant", "admin"].includes(role)) {
      return NextResponse.json({ message: "Rol inválido" }, { status: 400 });
    }

    const [existing] = await db.query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);
    if (existing.length > 0) {
      return NextResponse.json(
        { message: "El correo ya está registrado" },
        { status: 409 },
      );
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
      [email, hashed, role],
    );

    return NextResponse.json(
      { id: result.insertId, email, role },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al crear usuario" },
      { status: 500 },
    );
  }
}
