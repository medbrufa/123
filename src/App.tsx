
import React, { useEffect, useMemo, useState } from "react";

type Role = "admin" | "viewer";

type User = {
  id: number;
  username: string;
  password: string;
  role: Role;
  name: string;
};

type Supplier = {
  id: number;
  name: string;
};

type Lot = {
  id: number;
  product: string;
  supplier: string;
  internalBatch: string;
  quantity: string;
  unit: string;
  expiry: string;
};

type Movement = {
  id: number;
  type: "Entrata" | "Uscita" | "Trasferimento";
  product: string;
  internalBatch: string;
  quantity: string;
};

const STORAGE_KEY = "med-v3";

const today = new Date().toISOString().slice(0, 10);

function parseNumber(v: string) {
  return Number(v || 0);
}

export default function App() {
  const [db, setDb] = useState<any>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved
      ? JSON.parse(saved)
      : {
          users: [
            { id: 1, username: "admin", password: "admin", role: "admin", name: "Admin" },
          ],
          suppliers: [],
          lots: [],
          movements: [],
        };
  });

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  }, [db]);

  // LOGIN
  if (!user) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Login MED</h2>
        <button onClick={() => setUser(db.users[0])}>Entra</button>
      </div>
    );
  }

  // GIACENZA LOTTO
  function getLotStock(lot: Lot) {
    let stock = parseNumber(lot.quantity);

    db.movements
      .filter((m: Movement) => m.internalBatch === lot.internalBatch)
      .forEach((m: Movement) => {
        const q = parseNumber(m.quantity);

        if (m.type === "Entrata") stock += q;
        if (m.type === "Uscita") stock -= q;
      });

    return stock;
  }

  // GIACENZA PRODOTTO
  function getProductStock(product: string) {
    return db.lots
      .filter((l: Lot) => l.product === product)
      .reduce((acc: number, lot: Lot) => acc + getLotStock(lot), 0);
  }

  // FORM
  const [lotForm, setLotForm] = useState<any>({
    product: "",
    supplier: "",
    internalBatch: "",
    quantity: "",
    unit: "kg",
    expiry: today,
  });

  const [movForm, setMovForm] = useState<any>({
    type: "Uscita",
    product: "",
    internalBatch: "",
    quantity: "",
  });

  const [supplierName, setSupplierName] = useState("");

  // ADD LOT
  const addLot = () => {
    setDb((p: any) => ({
      ...p,
      lots: [{ id: Date.now(), ...lotForm }, ...p.lots],
    }));
  };

  // ADD MOVEMENT
  const addMovement = () => {
    const lot = db.lots.find(
      (l: Lot) => l.internalBatch === movForm.internalBatch
    );

    if (!lot) return alert("Lotto non trovato");

    const stock = getLotStock(lot);

    if (movForm.type === "Uscita" && parseNumber(movForm.quantity) > stock) {
      return alert("Giacenza insufficiente");
    }

    setDb((p: any) => ({
      ...p,
      movements: [{ id: Date.now(), ...movForm }, ...p.movements],
    }));
  };

  // ADD SUPPLIER
  const addSupplier = () => {
    setDb((p: any) => ({
      ...p,
      suppliers: [...p.suppliers, { id: Date.now(), name: supplierName }],
    }));
    setSupplierName("");
  };

  // STAMPA ETICHETTA
  const printLabel = (lot: Lot) => {
    const win = window.open("", "_blank");
    if (!win) return;

    win.document.write(`
      <html>
      <body style="font-family:sans-serif">
        <h2>${lot.product}</h2>
        <p>Lotto: ${lot.internalBatch}</p>
        <p>Scadenza: ${lot.expiry}</p>
      </body>
      </html>
    `);

    win.print();
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Gestionale MED</h1>

      {/* FORNITORI */}
      <h2>Fornitori</h2>
      <input
        value={supplierName}
        onChange={(e) => setSupplierName(e.target.value)}
      />
      <button onClick={addSupplier}>Aggiungi</button>

      {db.suppliers.map((s: Supplier) => (
        <div key={s.id}>{s.name}</div>
      ))}

      {/* LOTTI */}
      <h2>Lotti</h2>

      <input
        placeholder="Prodotto"
        onChange={(e) => setLotForm({ ...lotForm, product: e.target.value })}
      />

      <select
        onChange={(e) => setLotForm({ ...lotForm, supplier: e.target.value })}
      >
        <option value="">Fornitore</option>
        {db.suppliers.map((s: Supplier) => (
          <option key={s.id}>{s.name}</option>
        ))}
      </select>

      <input
        placeholder="Lotto"
        onChange={(e) =>
          setLotForm({ ...lotForm, internalBatch: e.target.value })
        }
      />

      <input
        placeholder="Quantità"
        onChange={(e) =>
          setLotForm({ ...lotForm, quantity: e.target.value })
        }
      />

      <button onClick={addLot}>Salva lotto</button>

      {db.lots.map((lot: Lot) => (
        <div key={lot.id} style={{ border: "1px solid #ccc", margin: 10 }}>
          <b>{lot.product}</b> | {getLotStock(lot)} {lot.unit}
          <br />
          Lotto: {lot.internalBatch}
          <br />
          <button onClick={() => printLabel(lot)}>Stampa etichetta</button>
        </div>
      ))}

      {/* MOVIMENTI */}
      <h2>Movimenti</h2>

      <select
        onChange={(e) => setMovForm({ ...movForm, type: e.target.value })}
      >
        <option>Entrata</option>
        <option>Uscita</option>
      </select>

      <input
        placeholder="Lotto"
        onChange={(e) =>
          setMovForm({ ...movForm, internalBatch: e.target.value })
        }
      />

      <input
        placeholder="Quantità"
        onChange={(e) =>
          setMovForm({ ...movForm, quantity: e.target.value })
        }
      />

      <button onClick={addMovement}>Registra</button>

      {/* GIACENZE */}
      <h2>Giacenze</h2>

      {[...new Set(db.lots.map((l: Lot) => l.product))].map((p: string) => (
        <div key={p}>
          {p} → {getProductStock(p)}
        </div>
      ))}
    </div>
  );
}
