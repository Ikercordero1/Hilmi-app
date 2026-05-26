//API route para manejar uploads de comprobantes de pago.
//  Guarda el archivo en /public/uploads y actualiza la solicitud correspondiente en la base de datos.
import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import db from "../../../lib/db";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const requestId = formData.get("request_id");

    if (!file) {
      return NextResponse.json(
        { message: "No se recibió archivo" },
        { status: 400 },
      );
    }

    // Guardar archivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const filename = `${Date.now()}-${file.name.replace(/\s/g, "_")}`;
    const filepath = path.join(uploadsDir, filename);
    await writeFile(filepath, buffer);
    const publicPath = `/uploads/${filename}`;

    // Actualizar solicitud: guardar comprobante y cambiar estado a "en_revision"
    if (requestId) {
      await db.query(
        `UPDATE appointment_requests
SET payment_proof = ?, status = 'en_revision'
WHERE id = ? AND status = 'pendiente_pago'`,
        [publicPath, requestId],
      );
    }

    return NextResponse.json({ path: publicPath }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Error al subir archivo" },
      { status: 500 },
    );
  }
}
