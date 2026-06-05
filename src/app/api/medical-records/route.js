import { NextResponse } from "next/server";
import db from "../../../lib/db";

// GET /api/medical-records
export async function GET() {
  try {
    const [rows] = await db.query(
      `SELECT
mr.id,
mr.visit_date,
mr.diagnosis,
mr.treatment,
mr.notes,
mr.vet_name,
mr.created_at,
p.id AS pet_id,
p.pet_name,
p.species,
p.breed,
p.age,
p.owner_name,
p.owner_cedula,
p.owner_phone

FROM medical_records mr
LEFT JOIN pets p ON mr.pet_id = p.id
ORDER BY mr.visit_date DESC, mr.created_at DESC`,
    );

    const recordIds = rows.map((r) => r.id);
    let suppliesMap = {};

    if (recordIds.length > 0) {
      const [supplies] = await db.query(
        `SELECT
rs.record_id,
rs.inventory_id,
rs.quantity_used,
i.name AS supply_name,
i.unit,
i.category
FROM record_supplies rs
LEFT JOIN inventory i ON rs.inventory_id = i.id
WHERE rs.record_id IN (${recordIds.map(() => "?").join(",")})`,
        recordIds,
      );

      supplies.forEach((s) => {
        if (!suppliesMap[s.record_id]) suppliesMap[s.record_id] = [];
        suppliesMap[s.record_id].push({
          inventory_id: s.inventory_id,
          name: s.supply_name,
          quantity_used: s.quantity_used,
          unit: s.unit,
          category: s.category,
        });
      });
    }

    const data = rows.map((r) => ({
      ...r,
      supplies: suppliesMap[r.id] || [],
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[GET /api/medical-records]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error al obtener registros",
        error: error.message,
      },
      { status: 500 },
    );
  }
}

// POST /api/medical-records
export async function POST(request) {
  try {
    const body = await request.json();
    const {
      pet_id,
      vet_name,
      visit_date,
      diagnosis,
      treatment,
      notes,
      supplies = [],
    } = body;

    if (!pet_id || !visit_date || !diagnosis) {
      return NextResponse.json(
        {
          success: false,
          message: "Faltan campos obligatorios: pet_id, visit_date, diagnosis",
        },
        { status: 400 },
      );
    }

    const [recordResult] = await db.query(
      `INSERT INTO medical_records (pet_id, vet_name, visit_date, diagnosis, treatment, notes)
VALUES (?, ?, ?, ?, ?, ?)`,
      [
        pet_id,
        vet_name || null,
        visit_date,
        diagnosis,
        treatment || null,
        notes || null,
      ],
    );

    const record_id = recordResult.insertId;
    const stockWarnings = [];

    for (const item of supplies) {
      const { inventory_id, quantity_used } = item;
      if (!inventory_id || !quantity_used || quantity_used <= 0) continue;

      const [invRows] = await db.query(
        "SELECT quantity, name FROM inventory WHERE id = ?",
        [inventory_id],
      );

      if (invRows.length === 0) {
        stockWarnings.push({
          inventory_id,
          message: `Insumo ID ${inventory_id} no encontrado, se omitió.`,
        });
        continue;
      }

      const currentStock = invRows[0].quantity;
      const supplyName = invRows[0].name;
      const toDeduct = Math.min(currentStock, quantity_used);

      if (quantity_used > currentStock) {
        stockWarnings.push({
          inventory_id,
          name: supplyName,
          requested: quantity_used,
          available: currentStock,
          deducted: toDeduct,
          message: `Stock insuficiente para "${supplyName}". Se usaron ${toDeduct} de ${currentStock} disponibles.`,
        });
      }

      await db.query(
        `INSERT INTO record_supplies (record_id, inventory_id, quantity_used) VALUES (?, ?, ?)`,
        [record_id, inventory_id, toDeduct],
      );

      if (toDeduct > 0) {
        await db.query(
          "UPDATE inventory SET quantity = quantity - ? WHERE id = ?",
          [toDeduct, inventory_id],
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        message:
          stockWarnings.length > 0
            ? "Registro creado con advertencias de stock"
            : "Registro creado correctamente",
        record_id,
        stockWarnings,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("[POST /api/medical-records]", error);
    return NextResponse.json(
      {
        success: false,
        message: "Error al crear registro",
        error: error.message,
      },
      { status: 500 },
    );
  }
}
