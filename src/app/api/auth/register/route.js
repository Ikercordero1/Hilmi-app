//En este register se manejan las rutas para registrar nuevos usuarios. Se reciben los datos del formulario,
// se valida la contraseña, se verifica que el correo no esté registrado, se hashea la contraseña y
//  se guarda en la base de datos. Se devuelve una respuesta al cliente indicando el resultado de la operación.
import { NextResponse } from "next/server";
import db from "../../../../lib/db";
import bcrypt from "bcryptjs";

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.#\-_])[A-Za-z\d@$!%*?&.#\-_]{8,}$/;

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ message: "Faltan datos" }, { status: 400 });
    }

    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        { message: "Contraseña demasiado débil" },
        { status: 400 },
      );
    }

    const [existingUser] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );
    if (existingUser.length > 0) {
      return NextResponse.json(
        { message: "El correo ya está registrado" },
        { status: 409 },
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Siempre se crea como 'user' — el admin asigna roles superiores o el que desee.
    await db.query(
      "INSERT INTO users (email, password, role) VALUES (?, ?, 'user')",
      [email, hashedPassword],
    );

    return NextResponse.json(
      { message: "Usuario creado con éxito" },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error en el servidor" },
      { status: 500 },
    );
  }
}
