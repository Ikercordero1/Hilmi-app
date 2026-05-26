//API para manejar las cuentas de pago (GET para obtener todas las cuentas, POST para crear una nueva cuenta).

import { NextResponse } from "next/server";
import db from "../../../lib/db";

export async function GET() {
  try {
    const [rows] = await db.query(
      "SELECT * FROM payment_accounts ORDER BY created_at ASC",
    );
    return NextResponse.json(rows, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al obtener cuentas" },
      { status: 500 },
    );
  }
}

export async function POST(request) {
  try {
    const { bank_name, account_number, account_holder } = await request.json();

    if (!bank_name || !account_number || !account_holder) {
      return NextResponse.json({ message: "Faltan datos" }, { status: 400 });
    }

    const [result] = await db.query(
      "INSERT INTO payment_accounts (bank_name, account_number, account_holder) VALUES (?, ?, ?)",
      [bank_name, account_number, account_holder],
    );

    return NextResponse.json(
      { id: result.insertId, bank_name, account_number, account_holder },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al crear cuenta" },
      { status: 500 },
    );
  }
}
