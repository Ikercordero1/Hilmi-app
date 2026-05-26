//Este middlewware evita que los usuarios 
// entren a /home sin un token válido, redirigiéndolos al login, 
// en español, nadie puede entrar al home sin un usuario definido. (por mejorar sustancialmente)

import { NextResponse } from "next/server";

export function middleware(request) {
  const token = request.cookies.get("token");

  // Si intenta entrar a /home sin token, lo manda al login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

// Qué rutas protege:
export const config = {
  matcher: ["/home/:path*"],
   matcher: ["/pacients/home/:path*"],
};
