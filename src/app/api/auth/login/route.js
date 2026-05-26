// En este archivo se maneja la ruta para el login de los usuarios. Se reciben las credenciales del formulario,
//  se verifica en la base de datos y se devuelve una respuesta al cliente con un mensaje de bienvenida,
//  los datos del usuario y la ruta a la que debe ser redirigido según su rol. 
import { NextResponse } from "next/server";
import db from "../../../../lib/db";
import bcrypt from "bcryptjs";

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [
      email,
    ]);
    if (users.length === 0) {
      return NextResponse.json(
        { message: "Usuario no encontrado" },
        { status: 404 },
      );
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { message: "Contraseña incorrecta" },
        { status: 401 },
      );
    }

    const redirectMap = {
      admin: "/admin/home",
      assistant: "/assistant/home",
      user: "/pacients/home",
    };
    const redirectTo = redirectMap[user.role] ?? "/pacients/home";

    const response = NextResponse.json(
      {
        message: "Bienvenido a HILMI",
        user: { id: user.id, email: user.email, role: user.role },
        redirectTo,
      },
      { status: 200 },
    );

    response.cookies.set("token", "loggedin", {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    response.cookies.set("user_id", String(user.id), {
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24,
    });
    response.cookies.set("role", user.role, {
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return response;
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Error interno" }, { status: 500 });
  }
}
