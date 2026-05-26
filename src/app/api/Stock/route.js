//API Routes para manejar el inventario (CRUD básico)
import { NextResponse } from "next/server";
import db from "../../../lib/db";

// GET — Obtener inventario completo (con filtro de alertas opcional)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const alerts = searchParams.get("alerts"); // ?alerts=true → solo items bajos

    let query = "SELECT * FROM inventory";
    if (alerts === "true") {
      query += " WHERE quantity <= min_stock";
    }
    query += " ORDER BY category ASC, name ASC";

    const [rows] = await db.query(query);

    // Contar alertas totales
    const [alertCount] = await db.query(
      "SELECT COUNT(*) as count FROM inventory WHERE quantity <= min_stock",
    );

    return NextResponse.json({
      items: rows,
      alertCount: alertCount[0].count,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al obtener inventario" },
      { status: 500 },
    );
  }
}

// POST — Crear item de inventario
export async function POST(request) {
  try {
    const { name, category, quantity, unit, min_stock, price } =
      await request.json();

    if (!name || quantity === undefined) {
      return NextResponse.json(
        { message: "Nombre y cantidad son obligatorios" },
        { status: 400 },
      );
    }

    const [existing] = await db.query(
      "SELECT id FROM inventory WHERE name = ?",
      [name],
    );
    if (existing.length > 0) {
      return NextResponse.json(
        { message: "Ya existe un item con ese nombre" },
        { status: 409 },
      );
    }

    const [result] = await db.query(
      `INSERT INTO inventory (name, category, quantity, unit, min_stock, price)
VALUES (?, ?, ?, ?, ?, ?)`,
      [name, category, quantity, unit, min_stock ?? 5, price ?? 0],
    );

    return NextResponse.json(
      { id: result.insertId, message: "Item creado" },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al crear item" },
      { status: 500 },
    );
  }
}
