//En este archivo se manejan las rutas para actualizar o eliminar un item específico del inventario,
//  identificado por su ID. Se pueden editar todos los campos del item o
//  ajustar solo la cantidad mediante un campo "adjustment".
import { NextResponse } from "next/server";
import db from "../../../../lib/db";

// PUT — Actualizar item (editar datos o ajustar cantidad manualmente)
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const { name, category, quantity, unit, min_stock, price, adjustment } =
      await request.json();

    // Si viene "adjustment" es un ajuste de cantidad (+/-)
    if (adjustment !== undefined) {
      const [rows] = await db.query(
        "SELECT quantity FROM inventory WHERE id = ?",
        [id],
      );
      if (rows.length === 0) {
        return NextResponse.json(
          { message: "Item no encontrado" },
          { status: 404 },
        );
      }

      const newQty = parseFloat(rows[0].quantity) + parseFloat(adjustment);
      if (newQty < 0) {
        return NextResponse.json(
          { message: "Stock insuficiente" },
          { status: 409 },
        );
      }

      await db.query("UPDATE inventory SET quantity = ? WHERE id = ?", [
        newQty,
        id,
      ]);

      return NextResponse.json({
        message: "Cantidad actualizada",
        quantity: newQty,
      });
    }

    // Edición completa
    await db.query(
      `UPDATE inventory
SET name=?, category=?, quantity=?, unit=?, min_stock=?, price=?
WHERE id=?`,
      [name, category, quantity, unit, min_stock, price, id],
    );

    return NextResponse.json({ message: "Item actualizado" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al actualizar" },
      { status: 500 },
    );
  }
}

// DELETE — Eliminar item
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    await db.query("DELETE FROM inventory WHERE id = ?", [id]);
    return NextResponse.json({ message: "Item eliminado" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error al eliminar" }, { status: 500 });
  }
}
