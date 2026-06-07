"use client";

import { useState, useRef } from "react";

// ─── Utilidades ──────────────────────────────────────────────────────────────
function formatDate(dateStr) {
  const [year, month, day] = dateStr.split("-");
  const months = ["ene","feb","mar","abr","may","jun","jul","ago","sep","oct","nov","dic"];
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${year}`;
}

// ─── Modal de registro de vacuna ─────────────────────────────────────────────
function VaccineModal({ petName, onClose, onSave }) {
  const [form, setForm] = useState({ name: "", date: "", file: null });
  const [errors, setErrors] = useState({});
  const fileRef = useRef();

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "El nombre de la vacuna es requerido";
    if (!form.date) e.date = "La fecha de aplicación es requerida";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    onSave({ name: form.name.trim(), application_date: form.date, file: form.file });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-700 w-full max-w-md p-6 shadow-lg">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
              Registrar vacuna
            </h2>
            <p className="text-xs text-neutral-500 mt-0.5">Mascota: {petName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 text-xl leading-none"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">
            Nombre de la vacuna <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Ej. Rabia, Parvovirus, Triple Felina..."
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={`w-full px-3 py-2 text-sm rounded-lg border bg-neutral-50 dark:bg-neutral-800
              text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-teal-500
              ${errors.name ? "border-red-400" : "border-neutral-200 dark:border-neutral-700"}`}
          />
          {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
        </div>

        <div className="mb-4">
          <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">
            Fecha de aplicación <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={form.date}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            className={`w-full px-3 py-2 text-sm rounded-lg border bg-neutral-50 dark:bg-neutral-800
              text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-teal-500
              ${errors.date ? "border-red-400" : "border-neutral-200 dark:border-neutral-700"}`}
          />
          {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
        </div>

        <div className="mb-5">
          <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">
            Comprobante <span className="text-neutral-400">(opcional)</span>
          </label>
          <button
            type="button"
            onClick={() => fileRef.current.click()}
            className="w-full border border-dashed border-neutral-300 dark:border-neutral-600 rounded-lg p-4 text-center
              hover:border-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950 transition-colors"
          >
            <span className="text-2xl block mb-1">📎</span>
            {form.file ? (
              <p className="text-sm font-medium text-teal-700 dark:text-teal-400">{form.file.name}</p>
            ) : (
              <>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">Sube una foto del carnet físico</p>
                <p className="text-xs text-neutral-400 mt-0.5">PNG, JPG o PDF · máx. 5 MB</p>
              </>
            )}
          </button>
          <input ref={fileRef} type="file" accept="image/*,.pdf"
            onChange={(e) => setForm((f) => ({ ...f, file: e.target.files[0] || null }))}
            className="hidden"
          />
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-neutral-200 dark:border-neutral-700
              hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSubmit}
            className="px-5 py-2 text-sm font-medium rounded-lg bg-teal-600 hover:bg-teal-700 text-white transition-colors">
            Guardar vacuna
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Timeline de vacunas ──────────────────────────────────────────────────────
function VaccineTimeline({ vaccines, onAdd }) {
  const sorted = [...vaccines].sort(
    (a, b) => new Date(b.application_date) - new Date(a.application_date)
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider">Historial</span>
        <button onClick={onAdd}
          className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium
            px-3 py-1.5 rounded-lg transition-colors">
          <span className="text-base leading-none">+</span> Añadir vacuna
        </button>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-8">
          <span className="text-3xl block mb-2">💉</span>
          <p className="text-sm text-neutral-400">Sin vacunas registradas aún</p>
          <p className="text-xs text-neutral-300 mt-1">Usa el botón de arriba para añadir el historial previo</p>
        </div>
      ) : (
        <ul className="pl-3">
          {sorted.map((v) => (
            <li key={v.id}
              className="relative pl-5 pb-5 border-l-2 border-teal-200 dark:border-teal-800 last:border-l-transparent last:pb-0">
              <span className="absolute -left-[9px] top-0.5 w-4 h-4 rounded-full bg-teal-500 border-2 border-white dark:border-neutral-900" />
              <p className="text-sm font-medium text-neutral-900 dark:text-neutral-100">{v.name}</p>
              <p className="text-xs text-neutral-500 mt-0.5">{formatDate(v.application_date)}</p>
              {v.note && (
                <span className="inline-block mt-1.5 text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                  {v.note}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Tarjeta de mascota ───────────────────────────────────────────────────────
function PetCard({ pet, isOpen, onToggle, onVaccineAdd }) {
  const [activeTab, setActiveTab] = useState("info");

  return (
    <div className={`bg-white dark:bg-neutral-900 rounded-xl border transition-all duration-200
      ${isOpen
        ? "border-teal-400 dark:border-teal-600 shadow-sm"
        : "border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700"
      }`}>
      <button onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left" aria-expanded={isOpen}>
        <span className="text-3xl">{pet.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-neutral-900 dark:text-neutral-100">{pet.name}</p>
          <p className="text-xs text-neutral-500 mt-0.5 truncate">{pet.species} · {pet.breed}</p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300 shrink-0">
          {pet.vaccines.length} vacuna{pet.vaccines.length !== 1 ? "s" : ""}
        </span>
        <span className={`text-neutral-400 transition-transform duration-200 shrink-0 ${isOpen ? "rotate-180" : ""}`}>▾</span>
      </button>

      {isOpen && (
        <div className="border-t border-neutral-100 dark:border-neutral-800">
          <div className="flex border-b border-neutral-100 dark:border-neutral-800">
            {["info", "vax"].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-sm transition-colors
                  ${activeTab === tab
                    ? "text-teal-600 dark:text-teal-400 border-b-2 border-teal-500 font-medium"
                    : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                  }`}>
                {tab === "info" ? "Información general" : "Cartilla de vacunación"}
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeTab === "info" ? (
              <dl className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {[
                  ["Nombre", pet.name],
                  ["Especie", pet.species],
                  ["Raza", pet.breed],
                  ["Edad", pet.age],
                  ["Peso", pet.weight],
                  ["Color", pet.color],
                  ["Cédula propietario", pet.owner_cedula],
                  ["Correo propietario", pet.owner_email],
                ].map(([label, value]) => value && (
                  <div key={label} className="flex justify-between py-2 text-sm">
                    <dt className="text-neutral-500">{label}</dt>
                    <dd className="font-medium text-neutral-900 dark:text-neutral-100">{value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <VaccineTimeline vaccines={pet.vaccines} onAdd={() => onVaccineAdd(pet.id)} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pantalla de búsqueda por cédula ─────────────────────────────────────────
function CedulaSearch({ onFound }) {
  const [cedula, setCedula] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async () => {
    const trimmed = cedula.trim();
    if (!trimmed) {
      setError("Ingresa tu número de cédula");
      return;
    }
    setError("");
    setLoading(true);
    try {
      // El correo del usuario autenticado viene de la sesión (NextAuth u otro)
      // Se usa como segunda capa de verificación en el backend
      const res = await fetch(`/api/client/pets?cedula=${encodeURIComponent(trimmed)}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Error al buscar. Intenta nuevamente.");
        return;
      }
      if (!data.pets || data.pets.length === 0) {
        setError("No se encontraron mascotas con esa cédula. Verifica el número o contacta a la clínica.");
        return;
      }
      onFound(data.pets, trimmed);
    } catch {
      setError("Error de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 w-full max-w-sm p-8 text-center">
        <span className="text-5xl block mb-4">🐾</span>
        <h1 className="text-xl font-medium text-neutral-900 dark:text-neutral-100 mb-1">
          Mis mascotas
        </h1>
        <p className="text-sm text-neutral-500 mb-6">
          Ingresa tu número de cédula para ver las mascotas asociadas a tu perfil
        </p>

        <div className="text-left mb-4">
          <label className="block text-sm text-neutral-600 dark:text-neutral-400 mb-1.5">
            Número de cédula
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Ej. 12345678"
            value={cedula}
            onChange={(e) => { setCedula(e.target.value); setError(""); }}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className={`w-full px-3 py-2.5 text-sm rounded-lg border bg-neutral-50 dark:bg-neutral-800
              text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-teal-500
              ${error ? "border-red-400" : "border-neutral-200 dark:border-neutral-700"}`}
          />
          {error && (
            <p className="text-xs text-red-500 mt-1.5">{error}</p>
          )}
        </div>

        <button
          onClick={handleSearch}
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-teal-600 hover:bg-teal-700 disabled:bg-teal-300
            text-white text-sm font-medium transition-colors"
        >
          {loading ? "Buscando..." : "Buscar mis mascotas"}
        </button>

        <p className="text-xs text-neutral-400 mt-4">
          ¿No encuentras tus mascotas? Contacta a la clínica para que las asocien a tu perfil.
        </p>
      </div>
    </div>
  );
}

// ─── Componente principal: MisMascotas ───────────────────────────────────────
export default function MisMascotas() {
  // "idle" | "found"
  const [stage, setStage] = useState("idle");
  const [pets, setPets] = useState([]);
  const [cedula, setCedula] = useState("");
  const [openPetId, setOpenPetId] = useState(null);
  const [modalPetId, setModalPetId] = useState(null);

  const handleFound = (fetchedPets, cedulaBuscada) => {
    // Cada mascota viene del backend con vaccines ya incluidas (JOIN o sub-query)
    // Si el backend no las incluye, añadir un segundo fetch aquí
    setPets(fetchedPets.map((p) => ({ ...p, vaccines: p.vaccines ?? [] })));
    setCedula(cedulaBuscada);
    setStage("found");
  };

  const togglePet = (id) => setOpenPetId((prev) => (prev === id ? null : id));

  const handleVaccineSave = async (petId, vaccineData) => {
    const formData = new FormData();
    formData.append("pet_id", petId);
    formData.append("name", vaccineData.name);
    formData.append("application_date", vaccineData.application_date);
    if (vaccineData.file) formData.append("proof", vaccineData.file);

    const res = await fetch("/api/client/vaccines", { method: "POST", body: formData });
    const saved = await res.json(); // { id, name, application_date, note }

    // Actualización optimista del estado local con el id real del backend
    setPets((prev) =>
      prev.map((p) =>
        p.id === petId
          ? { ...p, vaccines: [...p.vaccines, { ...saved, note: saved.note ?? "Autodeclarada" }] }
          : p
      )
    );
    setModalPetId(null);
  };

  // ── Pantalla de búsqueda ──
  if (stage === "idle") {
    return <CedulaSearch onFound={handleFound} />;
  }

  // ── Vista de mascotas ──
  const modalPet = pets.find((p) => p.id === modalPetId);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-medium text-neutral-900 dark:text-neutral-100">Mis mascotas</h1>
          <p className="text-sm text-neutral-500 mt-1">
            Mostrando mascotas de la cédula <span className="font-medium text-neutral-700 dark:text-neutral-300">{cedula}</span>
          </p>
        </div>
        {/* Botón para cambiar de cédula */}
        <button
          onClick={() => { setStage("idle"); setPets([]); setOpenPetId(null); }}
          className="shrink-0 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300
            border border-neutral-200 dark:border-neutral-700 rounded-lg px-3 py-1.5 transition-colors"
        >
          Cambiar cédula
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {pets.map((pet) => (
          <PetCard
            key={pet.id}
            pet={pet}
            isOpen={openPetId === pet.id}
            onToggle={() => togglePet(pet.id)}
            onVaccineAdd={(id) => setModalPetId(id)}
          />
        ))}
      </div>

      {modalPetId && modalPet && (
        <VaccineModal
          petName={modalPet.name}
          onClose={() => setModalPetId(null)}
          onSave={(data) => handleVaccineSave(modalPetId, data)}
        />
      )}
    </div>
  );
}

/*  


─── Tabla client_vaccinations (si aún no la creaste) ─────────────────────────

CREATE TABLE IF NOT EXISTS client_vaccinations (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  pet_id           INT UNSIGNED NOT NULL,
  name             VARCHAR(120)  NOT NULL,
  application_date DATE          NOT NULL,
  note             VARCHAR(255)  NULL,
  proof_url        VARCHAR(500)  NULL,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cvax_pet FOREIGN KEY (pet_id) REFERENCES pets (id) ON DELETE CASCADE
);
CREATE INDEX idx_cvax_pet ON client_vaccinations (pet_id);
*/