// src/lib/inventorySync.js
// Usa `quantity` — nombre real de la columna en tu tabla inventory.

export async function applySupplies(conn, supplies) {
  for (const s of supplies) {
    if (!s.supply_name?.trim()) continue;
    const name = s.supply_name.trim();
    const qty  = parseFloat(s.quantity) || 0;
    const unit = s.unit?.trim() || "";

    const [rows] = await conn.query(
      "SELECT id, quantity FROM inventory WHERE LOWER(name) = LOWER(?)",
      [name]
    );

    if (rows.length > 0) {
      await conn.query(
        "UPDATE inventory SET quantity = quantity - ?, updated_at = NOW() WHERE id = ?",
        [qty, rows[0].id]
      );
    } else {
      // Artículo nuevo → nace con quantity negativa (consumido sin entrada previa)
      await conn.query(
        "INSERT INTO inventory (name, quantity, unit, min_stock, price) VALUES (?, ?, ?, 0, 0)",
        [name, -qty, unit]
      );
    }
  }
}

export async function reverseSupplies(conn, supplies) {
  for (const s of supplies) {
    if (!s.supply_name?.trim()) continue;
    const name = s.supply_name.trim();
    const qty  = parseFloat(s.quantity) || 0;

    const [rows] = await conn.query(
      "SELECT id FROM inventory WHERE LOWER(name) = LOWER(?)",
      [name]
    );

    if (rows.length > 0) {
      await conn.query(
        "UPDATE inventory SET quantity = quantity + ?, updated_at = NOW() WHERE id = ?",
        [qty, rows[0].id]
      );
    }
  }
}

export async function diffSupplies(conn, oldList, newList) {
  const oldMap  = buildMap(oldList);
  const newMap  = buildMap(newList);
  const allKeys = new Set([...Object.keys(oldMap), ...Object.keys(newMap)]);

  for (const key of allKeys) {
    const oldQty = oldMap[key]?.qty || 0;
    const newQty = newMap[key]?.qty || 0;
    const delta  = oldQty - newQty; // positivo = devolver, negativo = consumir más
    const name   = newMap[key]?.name || oldMap[key]?.name;
    const unit   = newMap[key]?.unit || oldMap[key]?.unit || "";

    if (delta === 0) continue;

    const [rows] = await conn.query(
      "SELECT id FROM inventory WHERE LOWER(name) = LOWER(?)",
      [name]
    );

    if (rows.length > 0) {
      await conn.query(
        "UPDATE inventory SET quantity = quantity + ?, updated_at = NOW() WHERE id = ?",
        [delta, rows[0].id]
      );
    } else if (delta < 0) {
      await conn.query(
        "INSERT INTO inventory (name, quantity, unit, min_stock, price) VALUES (?, ?, ?, 0, 0)",
        [name, delta, unit]
      );
    }
  }
}

function buildMap(list = []) {
  const map = {};
  for (const s of list) {
    if (!s.supply_name?.trim()) continue;
    const key = s.supply_name.trim().toLowerCase();
    map[key] = {
      name: s.supply_name.trim(),
      qty:  parseFloat(s.quantity) || 0,
      unit: s.unit?.trim() || "",
    };
  }
  return map;
}