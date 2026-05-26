//Esta API maneja las operaciones relacionadas con las mascotas, como buscar por nombre, dueño o cédula, 
// y crear nuevas fichas de mascotas. Se conecta a la base de datos MySQL para realizar estas operaciones.
import { NextResponse } from "next/server";
import db from "../../../lib/db";

// GET — Buscar mascotas (por nombre, dueño o cédula)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") ?? "";

    const [rows] = await db.query(
      `SELECT * FROM pets
WHERE pet_name LIKE ?
OR owner_name LIKE ?
OR owner_cedula LIKE ?
ORDER BY created_at DESC`,
      [`%${search}%`, `%${search}%`, `%${search}%`],
    );
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al obtener mascotas" },
      { status: 500 },
    );
  }
}

// POST — Crear ficha de mascota
export async function POST(request) {
  try {
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

    if (!owner_name || !owner_cedula || !pet_name || !species) {
      return NextResponse.json(
        { message: "Faltan datos obligatorios" },
        { status: 400 },
      );
    }

    // Verificar duplicado
    const [existing] = await db.query(
      "SELECT id FROM pets WHERE owner_cedula = ? AND pet_name = ?",
      [owner_cedula, pet_name],
    );
    if (existing.length > 0) {
      return NextResponse.json(
        {
          message: "Ya existe una mascota con ese nombre para esa cédula",
          id: existing[0].id,
        },
        { status: 409 },
      );
    }

    const [result] = await db.query(
      `INSERT INTO pets (owner_name, owner_cedula, owner_phone, pet_name, species, breed, age, notes)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        owner_name,
        owner_cedula,
        owner_phone,
        pet_name,
        species,
        breed,
        age,
        notes,
      ],
    );

    return NextResponse.json(
      { id: result.insertId, message: "Mascota registrada" },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al registrar mascota" },
      { status: 500 },
    );
  }
}
