//Base de datos del proyecto.

import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "", 
  database: "hilmi_db", 
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default db;
