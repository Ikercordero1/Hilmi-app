import { NextResponse } from "next/server";
import db from "../../../lib/db";

// GET /api/inventory
export async function GET() {
  try {
    const [rows] = await db.query(
      `SELECT 
        id          AS inventory_id,
        name,
        category,
        quantity    AS stock,
        unit,
        min_stock,
        price
       FROM inventory
       ORDER BY category ASC, name ASC`,
    );

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error("[GET /api/inventory]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error al obtener inventario",
        error: error.message,
      },
      { status: 500 },
    );
  }
}

// POST /api/inventory
export async function POST(request) {
  try {
    const body = await request.json();
    const { name, category, quantity, unit, min_stock, price } = body;

    if (!name || quantity === undefined || !unit) {
      return NextResponse.json(
        {
          success: false,
          message: "Faltan campos obligatorios: name, quantity, unit",
        },
        { status: 400 },
      );
    }

    const [result] = await db.query(
      `INSERT INTO inventory (name, category, quantity, unit, min_stock, price)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, category || null, quantity, unit, min_stock || 5, price || 0],
    );

    return NextResponse.json(
      {
        success: true,
        message: "Insumo creado",
        inventory_id: result.insertId,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/inventory]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error al crear insumo",
        error: error.message,
      },
      { status: 500 },
    );
  }
}

// PATCH /api/inventory
// Body: { updates: [{ inventory_id, quantity_used }] }
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { success: false, message: "Se requiere un array 'updates'" },
        { status: 400 },
      );
    }

    const warnings = [];

    for (const item of updates) {
      const { inventory_id, quantity_used } = item;

      const [rows] = await db.query(
        "SELECT quantity, name FROM inventory WHERE id = ?",
        [inventory_id],
      );

      if (rows.length === 0) {
        warnings.push({
          inventory_id,
          message: "Insumo no encontrado, se omitió",
        });
        continue;
      }

      const current = rows[0].quantity;
      const name = rows[0].name;
      const toDeduct = Math.min(current, quantity_used);

      if (quantity_used > current) {
        warnings.push({
          inventory_id,
          name,
          requested: quantity_used,
          available: current,
          deducted: toDeduct,
          message: `Stock insuficiente para "${name}". Se descontaron ${toDeduct} de ${current} disponibles.`,
        });
      }

      if (toDeduct > 0) {
        await db.query(
          "UPDATE inventory SET quantity = quantity - ? WHERE id = ?",
          [toDeduct, inventory_id],
        );
      }
    }

    return NextResponse.json({
      success: true,
      message:
        warnings.length > 0
          ? "Stock actualizado con advertencias"
          : "Stock actualizado",
      warnings,
    });
  } catch (error) {
    console.error("[PATCH /api/inventory]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error al actualizar stock",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
