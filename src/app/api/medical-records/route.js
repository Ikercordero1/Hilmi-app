//En este archivo se manejan las rutas para obtener y crear registros médicos. La función GET permite filtrar por ID de mascota,
//  mientras que la función POST valida los datos recibidos y maneja la inserción tanto del registro 
// médico como de los insumos relacionados.
import { NextResponse } from "next/server";
import db from "../../../lib/db";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const petId = searchParams.get("pet_id");

    let query = `
      SELECT r.*, p.pet_name, p.owner_name
      FROM medical_records r
      JOIN pets p ON r.pet_id = p.id
    `;
    const params = [];

    if (petId) {
      query += " WHERE r.pet_id = ?";
      params.push(petId);
    }

    query += " ORDER BY r.visit_date DESC";

    const [rows] = await db.query(query, params);
    return NextResponse.json(rows);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al obtener registros" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const {
      pet_id,
      vet_name,
      visit_date,
      diagnosis,
      treatment,
      notes,
      supplies,
    } = await request.json();

    if (!pet_id || !visit_date || !diagnosis) {
      return NextResponse.json(
        { message: "Faltan datos obligatorios" },
        { status: 400 },
      );
    }

    // Crear registro médico
    const [result] = await db.query(
      `INSERT INTO medical_records (pet_id, vet_name, visit_date, diagnosis, treatment, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        pet_id,
        vet_name ?? null,
        visit_date,
        diagnosis,
        treatment ?? null,
        notes ?? null,
      ],
    );

    const recordId = result.insertId;

    // Insertar insumos si los hay
    if (Array.isArray(supplies) && supplies.length > 0) {
      const validSupplies = supplies.filter((s) => s.supply_name?.trim());

      if (validSupplies.length > 0) {
        const supplyValues = validSupplies.map((s) => [
          recordId,
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

    return NextResponse.json(
      { id: recordId, message: "Registro creado" },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al crear registro" },
      { status: 500 },
    );
  }
}
