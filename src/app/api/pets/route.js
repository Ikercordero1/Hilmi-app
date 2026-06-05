import { NextResponse } from "next/server";
import db from "../../../lib/db";

// GET
// Devuelve todas las mascotas con datos del dueño
export async function GET() {
  try {
    const [rows] = await db.query(
      `SELECT
        id,
        pet_name,
        species,
        breed,
        age,
        owner_name,
        owner_cedula,
        owner_phone,
        notes,
        created_at
       FROM pets
       ORDER BY pet_name ASC`,
    );

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("[GET /api/pets]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error al obtener mascotas",
        error: error.message,
      },
      { status: 500 },
    );
  }
}

// POST 
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      owner_name,
      owner_cedula,
      owner_phone,
      pet_name,
      species,
      breed,
      age,
      notes,
    } = body;

    if (!owner_name || !owner_cedula || !pet_name || !species) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Faltan campos obligatorios: owner_name, owner_cedula, pet_name, species",
        },
        { status: 400 },
      );
    }

    const [result] = await db.query(
      `INSERT INTO pets (owner_name, owner_cedula, owner_phone, pet_name, species, breed, age, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        owner_name,
        owner_cedula,
        owner_phone || null,
        pet_name,
        species,
        breed || null,
        age || null,
        notes || null,
      ],
    );

    return NextResponse.json(
      { success: true, message: "Mascota registrada", id: result.insertId },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/pets]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error al registrar mascota",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
