import React, { useEffect, useMemo, useState } from "react"; import { CalendarDays, ClipboardList, Factory, LogOut, Package, ShoppingCart, Users, Warehouse, Wine } from "lucide-react";

type Role = "admin" | "viewer"; type ViewerPage = "laboratorio" | "vini" | "acquisti" | "menu" | null; type LotStatus = "OK" | "Non Conforme" | "Esaurito";

type User = { id: number; username: string; password: string; role: Role; name: string; allowedWarehouses: string[]; };

type Lot = { id: number; receivedAt: string; supplier: string; product: string; category: string; internalBatch: string; quantity: string; unit: string; purchasePrice: string; totalValue: string; expiry: string; purchasedFor: string; allergens: string; status: LotStatus; notes: string; };

type Movement = { id: number; date: string; type: string; warehouse: string; product: string; internalBatch: string; quantity: string; unit: string; operator: string; notes: string; };

type Supplier = { id: number; name: string; contactName: string; phone: string; email: string; vatNumber: string; fiscalCode: string; notes: string; isActive: boolean; };

type WineItem = { id: number; name: string; winery: string; type: string; vintage: string; format: string; price: string; stock: number; notes: string; };

type MenuRequest = { id: number; text: string; status: string; createdAt: string; createdBy: string; };

type WarehouseItem = { id: number; name: string; active: "Attivo" | "Non attivo"; };

type LabProduction = { id: number; date: string; sourceProduct: string; sourceBatch: string; pieces: string; operator: string; notes: string; };

type AppSettings = { productCategories: string[]; movementTypes: string[]; units: string[]; workTypes: string[]; allergens: string[]; };

type DbState = { users: User[]; suppliers: Supplier[]; lots: Lot[]; movements: Movement[]; wines: WineItem[]; warehouses: WarehouseItem[]; labProductions: LabProduction[]; menuProducts: string; menuRequests: MenuRequest[]; settings: AppSettings; };

const STORAGE_KEY = "med-gestionale-deploy-ready-v1";

const today = new Date().toISOString().slice(0, 10);

const defaultSettings: AppSettings = { productCategories: ["Pesce", "Carne", "Verdure", "Preparazioni", "Semilavorati"], movementTypes: ["Utilizzo", "Trasferimento", "Scarto"], units: ["kg", "g", "L", "pz"], workTypes: ["Porzionatura", "Pulizia", "Taglio", "Confezionamento"], allergens: ["Nessuno", "Glutine", "Lattosio", "Frutta a guscio", "Uova", "Pesce"], };

const defaultState: DbState = { users: [ { id: 1, username: "admin", password: "admin123", role: "admin", name: "Admin MED", allowedWarehouses: [] }, { id: 2, username: "operatore", password: "view123", role: "viewer", name: "Operatore Visualizzazione", allowedWarehouses: ["Magazzino Principale", "Cucina"] }, ], suppliers: [ { id: 1, name: "Orto MED", contactName: "", phone: "", email: "", vatNumber: "", fiscalCode: "", notes: "Fornitore interno", isActive: true }, { id: 2, name: "Pescheria Adriatica", contactName: "", phone: "", email: "", vatNumber: "", fiscalCode: "", notes: "", isActive: true }, ], lots: [], movements: [], wines: [ { id: 1, name: "Sagrantino di Montefalco", winery: "Arnaldo Caprai", type: "Rosso", vintage: "2020", format: "0,75L", price: "48", stock: 12, notes: "Strutturato" }, { id: 2, name: "Grechetto", winery: "Antonelli", type: "Bianco", vintage: "2023", format: "0,75L", price: "26", stock: 18, notes: "Ottimo con crudi" }, ], warehouses: [ { id: 1, name: "Magazzino Principale", active: "Attivo" }, { id: 2, name: "Cucina", active: "Attivo" }, ], labProductions: [], menuProducts: "", menuRequests: [], settings: defaultSettings, };

function sanitizeDbState(raw: unknown): DbState { const parsed = raw && typeof raw === "object" ? (raw as Partial<DbState>) : {};

return { users: Array.isArray(parsed.users) ? parsed.users.map((user, index) => ({ id: typeof user?.id === "number" ? user.id : Date.now() + index, username: String(user?.username || ""), password: String(user?.password || ""), role: user?.role === "admin" ? "admin" : "viewer", name: String(user?.name || ""), allowedWarehouses: Array.isArray(user?.allowedWarehouses) ? user.allowedWarehouses.map((x) => String(x || "")) : [], })) : defaultState.users, suppliers: Array.isArray(parsed.suppliers) ? parsed.suppliers.map((supplier, index) => ({ id: typeof supplier?.id === "number" ? supplier.id : Date.now() + index, name: String(supplier?.name || ""), contactName: String(supplier?.contactName || ""), phone: String(supplier?.phone || ""), email: String(supplier?.email || ""), vatNumber: String(supplier?.vatNumber || ""), fiscalCode: String(supplier?.fiscalCode || ""), notes: String(supplier?.notes || ""), isActive: typeof supplier?.isActive === "boolean" ? supplier.isActive : true, })) : defaultState.suppliers, lots: Array.isArray(parsed.lots) ? parsed.lots.map((lot, index) => ({ id: typeof lot?.id === "number" ? lot.id : Date.now() + index, receivedAt: String(lot?.receivedAt || today), supplier: String(lot?.supplier || ""), product: String(lot?.product || ""), category: String(lot?.category || ""), internalBatch: String(lot?.internalBatch || ""), quantity: String(lot?.quantity || ""), unit: String(lot?.unit || "kg"), purchasePrice: String(lot?.purchasePrice || ""), totalValue: String(lot?.totalValue || ""), expiry: String(lot?.expiry || today), purchasedFor: String(lot?.purchasedFor || ""), allergens: String(lot?.allergens || "Nessuno"), status: lot?.status === "Non Conforme" || lot?.status === "Esaurito" ? lot.status : "OK", notes: String(lot?.notes || ""), })) : defaultState.lots, movements: Array.isArray(parsed.movements) ? parsed.movements.map((movement, index) => ({ id: typeof movement?.id === "number" ? movement.id : Date.now() + index, date: String(movement?.date || today), type: String(movement?.type || "Utilizzo"), warehouse: String(movement?.warehouse || "Magazzino Principale"), product: String(movement?.product || ""), internalBatch: String(movement?.internalBatch || ""), quantity: String(movement?.quantity || ""), unit: String(movement?.unit || "kg"), operator: String(movement?.operator || ""), notes: String(movement?.notes || ""), })) : defaultState.movements, wines: Array.isArray(parsed.wines) ? parsed.wines.map((wine, index) => ({ id: typeof wine?.id === "number" ? wine.id : Date.now() + index, name: String(wine?.name || ""), winery: String(wine?.winery || ""), type: String(wine?.type || "Bianco"), vintage: String(wine?.vintage || ""), format: String(wine?.format || "0,75L"), price: String(wine?.price || ""), stock: typeof wine?.stock === "number" ? wine.stock : Number(wine?.stock || 0), notes: String(wine?.notes || ""), })) : defaultState.wines, warehouses: Array.isArray(parsed.warehouses) ? parsed.warehouses.map((warehouse, index) => ({ id: typeof warehouse?.id === "number" ? warehouse.id : Date.now() + index, name: String(warehouse?.name || ""), active: warehouse?.active === "Non attivo" ? "Non attivo" : "Attivo", })) : defaultState.warehouses, labProductions: Array.isArray(parsed.labProductions) ? parsed.labProductions.map((item, index) => ({ id: typeof item?.id === "number" ? item.id : Date.now() + index, date: String(item?.date || today), sourceProduct: String(item?.sourceProduct || ""), sourceBatch: String(item?.sourceBatch || ""), pieces: String(item?.pieces || ""), operator: String(item?.operator || ""), notes: String(item?.notes || ""), })) : defaultState.labProductions, menuProducts: typeof parsed.menuProducts === "string" ? parsed.menuProducts : defaultState.menuProducts, menuRequests: Array.isArray(parsed.menuRequests) ? parsed.menuRequests.map((request, index) => ({ id: typeof request?.id === "number" ? request.id : Date.now() + index, text: String(request?.text || ""), status: String(request?.status || "Nuova"), createdAt: String(request?.createdAt || ""), createdBy: String(request?.createdBy || ""), })) : defaultState.menuRequests, settings: { productCategories: Array.isArray(parsed.settings?.productCategories) ? parsed.settings!.productCategories.map((x) => String(x || "")) : defaultSettings.productCategories, movementTypes: Array.isArray(parsed.settings?.movementTypes) ? parsed.settings!.movementTypes.map((x) => String(x || "")) : defaultSettings.movementTypes, units: Array.isArray(parsed.settings?.units) ? parsed.settings!.units.map((x) => String(x || "")) : defaultSettings.units, workTypes: Array.isArray(parsed.settings?.workTypes) ? parsed.settings!.workTypes.map((x) => String(x || "")) : defaultSettings.workTypes, allergens: Array.isArray(parsed.settings?.allergens) ? parsed.settings!.allergens.map((x) => String(x || "")) : defaultSettings.allergens, }, }; }

function usePersistentState() { const [state, setState] = useState<DbState>(() => { try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? sanitizeDbState(JSON.parse(raw)) : defaultState; } catch { return defaultState; } });

useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }, [state]);

return [state, setState] as const; }

function parseNumber(value: string) { return Number(String(value || "").replace(",", ".")); }

function cn(...classes: Array<string | false | null | undefined>) { return classes.filter(Boolean).join(" "); }

function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) { return <div className={cn("rounded-3xl border border-slate-200 bg-white shadow-sm", className)}>{children}</div>; }

function CardHeader({ children }: { children: React.ReactNode }) { return <div className="p-5 pb-0">{children}</div>; }

function CardContent({ children }: { children: React.ReactNode }) { return <div className="p-5">{children}</div>; }

function Button({ children, variant = "primary", className = "", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" }) { return ( <button className={cn( "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition", variant === "primary" ? "bg-slate-900 text-white hover:bg-slate-800" : "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50", className, )} {...props} > {children} </button> ); }

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) { return <input {...props} className={cn("w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500", props.className)} />; }

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) { return <textarea {...props} className={cn("min-h-[110px] w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500", props.className)} />; }

function SelectBox({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) { return ( <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"> {options.map((option) => ( <option key={option} value={option}> {option} </option> ))} </select> ); }

function Label({ children }: { children: React.ReactNode }) { return <label className="mb-2 block text-sm font-medium text-slate-700">{children}</label>; }

function Badge({ children }: { children: React.ReactNode }) { return <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">{children}</span>; }

function SectionTitle({ title, description }: { title: string; description?: string }) { return ( <div> <h2 className="text-xl font-semibold text-slate-900">{title}</h2> {description ? <p className="mt-1 text-sm text-slate-500">{description}</p> : null} </div> ); }

function StatCard({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: number }) { return ( <Card> <CardContent> <div className="flex items-center justify-between"> <div> <p className="text-sm text-slate-500">{label}</p> <p className="mt-1 text-3xl font-semibold">{value}</p> </div> <div className="rounded-2xl bg-slate-100 p-3"> <Icon className="h-5 w-5 text-slate-700" /> </div> </div> </CardContent> </Card> ); }

export default function App() { const [db, setDb] = usePersistentState(); const [currentUser, setCurrentUser] = useState<User | null>(null); const [viewerPage, setViewerPage] = useState<ViewerPage>(null); const [adminTab, setAdminTab] = useState<string | null>(null); const [login, setLogin] = useState({ username: "", password: "" });

const [lotForm, setLotForm] = useState<Omit<Lot, "id">>({ receivedAt: today, supplier: "", product: "", category: "", internalBatch: "", quantity: "", unit: "kg", purchasePrice: "", totalValue: "", expiry: today, purchasedFor: "", allergens: "Nessuno", status: "OK", notes: "", });

const [movementForm, setMovementForm] = useState<Omit<Movement, "id">>({ date: today, type: "Utilizzo", warehouse: "Magazzino Principale", product: "", internalBatch: "", quantity: "", unit: "kg", operator: "", notes: "", });

const [supplierForm, setSupplierForm] = useState<Omit<Supplier, "id">>({ name: "", contactName: "", phone: "", email: "", vatNumber: "", fiscalCode: "", notes: "", isActive: true, });

const [editingUserId, setEditingUserId] = useState<number | null>(null);

const [wineForm, setWineForm] = useState<Omit<WineItem, "id">>({ name: "", winery: "", type: "Bianco", vintage: "", format: "0,75L", price: "", stock: 0, notes: "", });

const [warehouseForm, setWarehouseForm] = useState<Omit<WarehouseItem, "id">>({ name: "", active: "Attivo", });

const [labForm, setLabForm] = useState<Omit<LabProduction, "id">>({ date: today, sourceProduct: "", sourceBatch: "", pieces: "", operator: "", notes: "", });

const [userForm, setUserForm] = useState({ username: "", password: "", role: "viewer" as Role, name: "", allowedWarehouses: [] as string[] }); const [settingsForm, setSettingsForm] = useState({ productCategory: "", movementType: "", unit: "", workType: "", allergen: "", }); const [menuRequestText, setMenuRequestText] = useState(""); const [search, setSearch] = useState({ lots: "", wines: "", viewerPurchases: "" });

const isAdmin = currentUser?.role === "admin"; const currentOperator = currentUser?.name || currentUser?.username || "";

useEffect(() => { setMovementForm((prev) => ({ ...prev, operator: currentOperator })); setLabForm((prev) => ({ ...prev, operator: currentOperator })); }, [currentOperator]);

const computedLotTotal = useMemo(() => { const q = parseNumber(lotForm.quantity); const p = parseNumber(lotForm.purchasePrice); return Number.isFinite(q) && Number.isFinite(p) && q > 0 ? (q * p).toFixed(2) : ""; }, [lotForm.quantity, lotForm.purchasePrice]);

const filteredLots = db.lots.filter((lot) => JSON.stringify(lot).toLowerCase().includes(search.lots.toLowerCase())); const filteredWines = db.wines.filter((wine) => JSON.stringify(wine).toLowerCase().includes(search.wines.toLowerCase())); const viewerLots = db.lots.filter( (lot) => String(lot.purchasedFor || "").trim().toLowerCase() === currentOperator.trim().toLowerCase() );

const loginUser = () => { const username = login.username.trim().toLowerCase(); const password = login.password.trim(); const user = db.users.find((u) => u.username.toLowerCase() === username && u.password === password); if (!user) return alert("Credenziali non corrette"); setCurrentUser(user); setViewerPage(null); setAdminTab(null); setLogin({ username: "", password: "" }); };

const logout = () => { setCurrentUser(null); setViewerPage(null); setAdminTab(null); };

const addLot = () => { if (!lotForm.product || !lotForm.internalBatch) return alert("Compila almeno prodotto e lotto interno"); setDb((prev) => ({ ...prev, lots: [{ id: Date.now(), ...lotForm, totalValue: lotForm.totalValue || computedLotTotal }, ...prev.lots], })); setLotForm({ receivedAt: today, supplier: "", product: "", category: "", internalBatch: "", quantity: "", unit: lotForm.unit, purchasePrice: "", totalValue: "", expiry: today, purchasedFor: "", allergens: "Nessuno", status: "OK", notes: "", }); };

const addMovement = () => { if (!movementForm.product || !movementForm.internalBatch) return alert("Compila prodotto e lotto interno"); setDb((prev) => ({ ...prev, movements: [{ id: Date.now(), ...movementForm, operator: currentOperator }, ...prev.movements], })); setMovementForm({ date: today, type: movementForm.type, warehouse: movementForm.warehouse, product: "", internalBatch: "", quantity: "", unit: movementForm.unit, operator: currentOperator, notes: "", }); };

const addSupplier = () => { if (!supplierForm.name.trim()) return alert("Inserisci nome fornitore"); setDb((prev) => ({ ...prev, suppliers: [{ id: Date.now(), ...supplierForm }, ...prev.suppliers] })); setSupplierForm({ name: "", contactName: "", phone: "", email: "", vatNumber: "", fiscalCode: "", notes: "", isActive: true }); };

const updateUser = (userId: number) => { if (!userForm.username || !userForm.password) return alert("Inserisci username e password"); setDb((prev) => ({ ...prev, users: prev.users.map((u) => u.id === userId ? { ...u, username: userForm.username, password: userForm.password, role: userForm.role, name: userForm.name, allowedWarehouses: userForm.role === "viewer" ? userForm.allowedWarehouses : [] } : u, ), })); setEditingUserId(null); setUserForm({ username: "", password: "", role: "viewer", name: "", allowedWarehouses: [] }); };

const startEditUser = (user: User) => { setEditingUserId(user.id); setUserForm({ username: user.username, password: user.password, role: user.role, name: user.name, allowedWarehouses: user.allowedWarehouses || [] }); };

const addWine = () => { if (!wineForm.name.trim()) return alert("Inserisci nome vino"); setDb((prev) => ({ ...prev, wines: [{ id: Date.now(), ...wineForm }, ...prev.wines] })); setWineForm({ name: "", winery: "", type: "Bianco", vintage: "", format: "0,75L", price: "", stock: 0, notes: "" }); };

const addWarehouse = () => { if (!warehouseForm.name.trim()) return alert("Inserisci nome magazzino"); setDb((prev) => ({ ...prev, warehouses: [{ id: Date.now(), ...warehouseForm }, ...prev.warehouses], })); setWarehouseForm({ name: "", active: "Attivo" }); };

const addLabProduction = () => { if (!labForm.sourceProduct.trim() || !labForm.sourceBatch.trim()) return alert("Inserisci prodotto e lotto origine"); setDb((prev) => ({ ...prev, labProductions: [{ id: Date.now(), ...labForm, operator: currentOperator }, ...prev.labProductions], })); setLabForm({ date: today, sourceProduct: "", sourceBatch: "", pieces: "", operator: currentOperator, notes: "", }); };

const addUser = () => { if (!userForm.username || !userForm.password) return alert("Inserisci username e password"); if (db.users.some((u) => u.username === userForm.username)) return alert("Utente già esistente"); setDb((prev) => ({ ...prev, users: [...prev.users, { id: Date.now(), username: userForm.username, password: userForm.password, role: userForm.role, name: userForm.name, allowedWarehouses: userForm.role === "viewer" ? userForm.allowedWarehouses : [] }], })); setUserForm({ username: "", password: "", role: "viewer", name: "", allowedWarehouses: [] }); };

const addSettingValue = (key: keyof AppSettings, value: string) => { const cleanValue = value.trim(); if (!cleanValue) return; setDb((prev) => ({ ...prev, settings: { ...prev.settings, [key]: prev.settings[key].includes(cleanValue) ? prev.settings[key] : [...prev.settings[key], cleanValue], }, })); };

const addMenuRequest = () => { if (!menuRequestText.trim()) return alert("Inserisci una richiesta"); setDb((prev) => ({ ...prev, menuRequests: [{ id: Date.now(), text: menuRequestText, status: "Nuova", createdAt: new Date().toLocaleString("it-IT"), createdBy: currentOperator }, ...prev.menuRequests], })); setMenuRequestText(""); };

if (!currentUser) { return ( <div className="min-h-screen bg-slate-100 px-4 py-10"> <div className="mx-auto max-w-md"> <Card> <CardHeader> <h1 className="text-3xl font-bold">MED</h1> </CardHeader> <CardContent> <div className="space-y-4"> <div> <Label>Utente</Label> <Input value={login.username} onChange={(e) => setLogin((prev) => ({ ...prev, username: e.target.value }))} /> </div> <div> <Label>Password</Label> <Input type="password" value={login.password} onChange={(e) => setLogin((prev) => ({ ...prev, password: e.target.value }))} /> </div> <Button className="w-full" onClick={loginUser}>Accedi</Button> </div> </CardContent> </Card> </div> </div> ); }

return ( <div className="min-h-screen bg-slate-50 px-4 py-6"> <div className="mx-auto max-w-7xl space-y-6"> <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"> <div> <h1 className="text-3xl font-bold text-slate-900">Gestionale MED</h1> <p className="mt-1 text-sm text-slate-500">Versione deploy pronta per GitHub e Vercel</p> </div> <div className="flex flex-wrap items-center gap-2"> <Badge>{isAdmin ? "Amministratore" : "Viewer"}</Badge> <Badge>{currentOperator}</Badge> <Button variant="outline" onClick={logout}><LogOut className="h-4 w-4" /> Esci</Button> </div> </div>

{isAdmin ? (
      <>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            ["dashboard", "Dashboard"],
            ["fornitori", "Fornitori"],
            ["lotti", "Registrazione prodotto"],
            ["laboratorio", "Laboratorio"],
            ["movimenti", "Movimenti"],
            ["magazzini", "Magazzini"],
            ["vini", "Vini"],
            ["impostazioni", "Impostazioni"],
          ].map(([key, label]) => (
            <Button key={key} variant={adminTab === key ? "primary" : "outline"} onClick={() => setAdminTab(key)}>
              {label}
            </Button>
          ))}
        </div>

        {!adminTab || adminTab === "dashboard" ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <StatCard icon={Package} label="Lotti" value={db.lots.length} />
            <StatCard icon={ClipboardList} label="Movimenti" value={db.movements.length} />
            <StatCard icon={Wine} label="Vini" value={db.wines.length} />
            <StatCard icon={Users} label="Utenti" value={db.users.length} />
            <StatCard icon={Warehouse} label="Magazzini" value={db.warehouses.length} />
            <StatCard icon={Factory} label="Laboratorio" value={db.labProductions.length} />
          </div>
        ) : null}

        {adminTab === "fornitori" ? (
          <div className="space-y-4">
            <SectionTitle title="Fornitori" description="Anagrafica fornitori" />
            <Card>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div><Label>Nome fornitore</Label><Input value={supplierForm.name} onChange={(e) => setSupplierForm((p) => ({ ...p, name: e.target.value }))} /></div>
                  <div><Label>Referente</Label><Input value={supplierForm.contactName} onChange={(e) => setSupplierForm((p) => ({ ...p, contactName: e.target.value }))} /></div>
                  <div><Label>Telefono</Label><Input value={supplierForm.phone} onChange={(e) => setSupplierForm((p) => ({ ...p, phone: e.target.value }))} /></div>
                  <div><Label>Email</Label><Input value={supplierForm.email} onChange={(e) => setSupplierForm((p) => ({ ...p, email: e.target.value }))} /></div>
                  <div><Label>Partita IVA</Label><Input value={supplierForm.vatNumber} onChange={(e) => setSupplierForm((p) => ({ ...p, vatNumber: e.target.value }))} /></div>
                  <div><Label>Codice fiscale</Label><Input value={supplierForm.fiscalCode} onChange={(e) => setSupplierForm((p) => ({ ...p, fiscalCode: e.target.value }))} /></div>
                  <div className="md:col-span-2 xl:col-span-3"><Label>Note</Label><Textarea value={supplierForm.notes} onChange={(e) => setSupplierForm((p) => ({ ...p, notes: e.target.value }))} /></div>
                  <div className="md:col-span-2 xl:col-span-3"><Button onClick={addSupplier}>Aggiungi fornitore</Button></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="space-y-3">{db.suppliers.map((supplier) => <div key={supplier.id} className="rounded-2xl border border-slate-200 p-4"><p className="font-semibold">{supplier.name}</p><p className="text-sm text-slate-500">{supplier.contactName || "Nessun referente"}</p><p className="text-sm text-slate-500">P.IVA: {supplier.vatNumber || "—"} • CF: {supplier.fiscalCode || "—"}</p></div>)}</div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {adminTab === "lotti" ? (
          <div className="space-y-4">
            <SectionTitle title="Registrazione prodotto" description="Inserisci lotti e acquisti" />
            <Card>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div><Label>Data ricezione</Label><Input type="date" value={lotForm.receivedAt} onChange={(e) => setLotForm((p) => ({ ...p, receivedAt: e.target.value }))} /></div>
                  <div><Label>Fornitore</Label><SelectBox value={lotForm.supplier} onChange={(value) => setLotForm((p) => ({ ...p, supplier: value }))} options={["", ...db.suppliers.filter((s) => s.isActive).map((s) => s.name)]} /></div>
                  <div><Label>Prodotto</Label><Input value={lotForm.product} onChange={(e) => setLotForm((p) => ({ ...p, product: e.target.value }))} /></div>
                  <div><Label>Categoria</Label><Input value={lotForm.category} onChange={(e) => setLotForm((p) => ({ ...p, category: e.target.value }))} /></div>
                  <div><Label>Lotto interno</Label><Input value={lotForm.internalBatch} onChange={(e) => setLotForm((p) => ({ ...p, internalBatch: e.target.value }))} /></div>
                  <div><Label>Quantità</Label><Input value={lotForm.quantity} onChange={(e) => setLotForm((p) => ({ ...p, quantity: e.target.value }))} /></div>
                  <div><Label>Unità</Label><SelectBox value={lotForm.unit} onChange={(value) => setLotForm((p) => ({ ...p, unit: value }))} options={["kg", "g", "L", "pz"]} /></div>
                  <div><Label>Prezzo unitario</Label><Input value={lotForm.purchasePrice} onChange={(e) => setLotForm((p) => ({ ...p, purchasePrice: e.target.value }))} /></div>
                  <div><Label>Totale</Label><Input value={lotForm.totalValue || computedLotTotal} onChange={(e) => setLotForm((p) => ({ ...p, totalValue: e.target.value }))} /></div>
                  <div><Label>Scadenza</Label><Input type="date" value={lotForm.expiry} onChange={(e) => setLotForm((p) => ({ ...p, expiry: e.target.value }))} /></div>
                  <div><Label>Acquistato per</Label><Input value={lotForm.purchasedFor} onChange={(e) => setLotForm((p) => ({ ...p, purchasedFor: e.target.value }))} /></div>
                  <div><Label>Allergeni</Label><Input value={lotForm.allergens} onChange={(e) => setLotForm((p) => ({ ...p, allergens: e.target.value }))} /></div>
                  <div><Label>Stato</Label><SelectBox value={lotForm.status} onChange={(value) => setLotForm((p) => ({ ...p, status: value as LotStatus }))} options={["OK", "Non Conforme", "Esaurito"]} /></div>
                  <div className="md:col-span-2 xl:col-span-3"><Label>Note</Label><Textarea value={lotForm.notes} onChange={(e) => setLotForm((p) => ({ ...p, notes: e.target.value }))} /></div>
                  <div className="md:col-span-2 xl:col-span-3"><Button onClick={addLot}>Salva lotto</Button></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <SectionTitle title="Registro lotti" />
                <Input placeholder="Cerca lotti..." value={search.lots} onChange={(e) => setSearch((p) => ({ ...p, lots: e.target.value }))} />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredLots.length === 0 ? <p className="text-sm text-slate-500">Nessun lotto registrato.</p> : filteredLots.map((lot) => (
                    <div key={lot.id} className="rounded-2xl border border-slate-200 p-4">
                      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                        <div>
                          <p className="font-semibold">{lot.product}</p>
                          <p className="text-sm text-slate-500">{lot.supplier} • {lot.internalBatch}</p>
                          <p className="text-sm text-slate-500">Acquistato per: {lot.purchasedFor || "Generico"}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge>{lot.status}</Badge>
                          <Badge>Scad. {lot.expiry || "—"}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {adminTab === "laboratorio" ? (
          <div className="space-y-4">
            <SectionTitle title="Laboratorio" description="Registra lavorazioni e preparazioni interne" />
            <Card>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div><Label>Data</Label><Input type="date" value={labForm.date} onChange={(e) => setLabForm((p) => ({ ...p, date: e.target.value }))} /></div>
                  <div><Label>Prodotto origine</Label><SelectBox value={labForm.sourceProduct} onChange={(value) => {
                    const selected = db.lots.find((l) => l.product === value);
                    setLabForm((p) => ({ ...p, sourceProduct: value, sourceBatch: selected?.internalBatch || "" }));
                  }} options={Array.from(new Set(db.lots.map((l) => l.product).filter(Boolean)))} /></div>
                  <div><Label>Lotto origine</Label><SelectBox value={labForm.sourceBatch} onChange={(value) => setLabForm((p) => ({ ...p, sourceBatch: value }))} options={db.lots.filter((l) => l.product === labForm.sourceProduct).map((l) => l.internalBatch)} /></div>
                  <div><Label>Pezzi creati</Label><Input value={labForm.pieces} onChange={(e) => setLabForm((p) => ({ ...p, pieces: e.target.value }))} /></div>
                  <div><Label>Operatore</Label><Input value={labForm.operator} readOnly /></div>
                  <div className="md:col-span-2 xl:col-span-3"><Label>Note</Label><Textarea value={labForm.notes} onChange={(e) => setLabForm((p) => ({ ...p, notes: e.target.value }))} /></div>
                  <div className="md:col-span-2 xl:col-span-3"><Button onClick={addLabProduction}>Registra lavorazione</Button></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="space-y-3">
                  {db.labProductions.length === 0 ? <p className="text-sm text-slate-500">Nessuna lavorazione registrata.</p> : db.labProductions.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                      <p className="font-semibold">{item.sourceProduct}</p>
                      <p className="text-sm text-slate-500">{item.sourceBatch} • {item.pieces || "0"} pezzi</p>
                      <p className="text-sm text-slate-500">{item.date} • {item.operator}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {adminTab === "movimenti" ? (
          <div className="space-y-4">
            <SectionTitle title="Movimenti" description="Utilizzo, trasferimento e scarto" />
            <Card>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div><Label>Data</Label><Input type="date" value={movementForm.date} onChange={(e) => setMovementForm((p) => ({ ...p, date: e.target.value }))} /></div>
                  <div><Label>Tipo</Label><SelectBox value={movementForm.type} onChange={(value) => setMovementForm((p) => ({ ...p, type: value }))} options={["Utilizzo", "Trasferimento", "Scarto"]} /></div>
                  <div><Label>Magazzino</Label><SelectBox value={movementForm.warehouse} onChange={(value) => setMovementForm((p) => ({ ...p, warehouse: value }))} options={db.warehouses.map((w) => w.name)} /></div>
                  <div><Label>Prodotto</Label><SelectBox value={movementForm.product} onChange={(value) => {
                    const selected = db.lots.find((l) => l.product === value);
                    setMovementForm((p) => ({ ...p, product: value, internalBatch: selected?.internalBatch || "" }));
                  }} options={Array.from(new Set(db.lots.map((l) => l.product).filter(Boolean)))} /></div>
                  <div><Label>Lotto interno</Label><SelectBox value={movementForm.internalBatch} onChange={(value) => setMovementForm((p) => ({ ...p, internalBatch: value }))} options={db.lots.filter((l) => l.product === movementForm.product).map((l) => l.internalBatch)} /></div>
                  <div><Label>Quantità</Label><Input value={movementForm.quantity} onChange={(e) => setMovementForm((p) => ({ ...p, quantity: e.target.value }))} /></div>
                  <div><Label>Unità</Label><SelectBox value={movementForm.unit} onChange={(value) => setMovementForm((p) => ({ ...p, unit: value }))} options={["kg", "g", "L", "pz"]} /></div>
                  <div className="md:col-span-2 xl:col-span-3"><Label>Note</Label><Textarea value={movementForm.notes} onChange={(e) => setMovementForm((p) => ({ ...p, notes: e.target.value }))} /></div>
                  <div className="md:col-span-2 xl:col-span-3"><Button onClick={addMovement}>Salva movimento</Button></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="space-y-3">
                  {db.movements.length === 0 ? <p className="text-sm text-slate-500">Nessun movimento registrato.</p> : db.movements.map((movement) => (
                    <div key={movement.id} className="rounded-2xl border border-slate-200 p-4">
                      <p className="font-semibold">{movement.product}</p>
                      <p className="text-sm text-slate-500">{movement.type} • {movement.internalBatch} • {movement.quantity} {movement.unit}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {adminTab === "magazzini" ? (
          <div className="space-y-4">
            <SectionTitle title="Magazzini" description="Gestione dei magazzini attivi" />
            <Card>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div><Label>Nome magazzino</Label><Input value={warehouseForm.name} onChange={(e) => setWarehouseForm((p) => ({ ...p, name: e.target.value }))} /></div>
                  <div><Label>Stato</Label><SelectBox value={warehouseForm.active} onChange={(value) => setWarehouseForm((p) => ({ ...p, active: value as "Attivo" | "Non attivo" }))} options={["Attivo", "Non attivo"]} /></div>
                  <div className="md:col-span-2 xl:col-span-3"><Button onClick={addWarehouse}>Aggiungi magazzino</Button></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent>
                <div className="space-y-3">
                  {db.warehouses.map((warehouse) => (
                    <div key={warehouse.id} className="rounded-2xl border border-slate-200 p-4 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{warehouse.name}</p>
                        <p className="text-sm text-slate-500">Stato: {warehouse.active}</p>
                      </div>
                      <Badge>{warehouse.active}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {adminTab === "vini" ? (
          <div className="space-y-4">
            <SectionTitle title="Vini" description="Gestione lista vini" />
            <Card>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <div><Label>Nome vino</Label><Input value={wineForm.name} onChange={(e) => setWineForm((p) => ({ ...p, name: e.target.value }))} /></div>
                  <div><Label>Cantina</Label><Input value={wineForm.winery} onChange={(e) => setWineForm((p) => ({ ...p, winery: e.target.value }))} /></div>
                  <div><Label>Tipologia</Label><Input value={wineForm.type} onChange={(e) => setWineForm((p) => ({ ...p, type: e.target.value }))} /></div>
                  <div><Label>Annata</Label><Input value={wineForm.vintage} onChange={(e) => setWineForm((p) => ({ ...p, vintage: e.target.value }))} /></div>
                  <div><Label>Formato</Label><Input value={wineForm.format} onChange={(e) => setWineForm((p) => ({ ...p, format: e.target.value }))} /></div>
                  <div><Label>Prezzo</Label><Input value={wineForm.price} onChange={(e) => setWineForm((p) => ({ ...p, price: e.target.value }))} /></div>
                  <div><Label>Stock</Label><Input type="number" value={wineForm.stock} onChange={(e) => setWineForm((p) => ({ ...p, stock: Number(e.target.value || 0) }))} /></div>
                  <div className="md:col-span-2 xl:col-span-3"><Label>Note</Label><Textarea value={wineForm.notes} onChange={(e) => setWineForm((p) => ({ ...p, notes: e.target.value }))} /></div>
                  <div className="md:col-span-2 xl:col-span-3"><Button onClick={addWine}>Aggiungi vino</Button></div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <SectionTitle title="Lista vini" />
                <Input placeholder="Cerca vini..." value={search.wines} onChange={(e) => setSearch((p) => ({ ...p, wines: e.target.value }))} />
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {filteredWines.map((wine) => (
                    <div key={wine.id} className="rounded-2xl border border-slate-200 p-4">
                      <p className="font-semibold">{wine.name}</p>
                      <p className="text-sm text-slate-500">{wine.winery} • {wine.type}</p>
                      <p className="text-sm text-slate-500">€ {wine.price || "—"} • {wine.stock} bottiglie</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {adminTab === "impostazioni" ? (
          <div className="space-y-4">
            <SectionTitle title="Impostazioni" description="Utenti, permessi e parametri a tendina" />
            <Card>
              <CardHeader><SectionTitle title="Nuovo utente" /></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div><Label>Nome</Label><Input value={userForm.name} onChange={(e) => setUserForm((p) => ({ ...p, name: e.target.value }))} /></div>
                  <div><Label>Username</Label><Input value={userForm.username} onChange={(e) => setUserForm((p) => ({ ...p, username: e.target.value }))} /></div>
                  <div><Label>Password</Label><Input value={userForm.password} onChange={(e) => setUserForm((p) => ({ ...p, password: e.target.value }))} /></div>
                  <div><Label>Ruolo</Label><SelectBox value={userForm.role} onChange={(value) => setUserForm((p) => ({ ...p, role: value as Role }))} options={["admin", "viewer"]} /></div>
                  {userForm.role === "viewer" ? <div className="md:col-span-2 xl:col-span-4"><Label>Magazzini visibili</Label><div className="flex flex-wrap gap-2">{db.warehouses.map((w) => <button key={w.id} type="button" onClick={() => setUserForm((prev) => ({ ...prev, allowedWarehouses: prev.allowedWarehouses.includes(w.name) ? prev.allowedWarehouses.filter((x) => x !== w.name) : [...prev.allowedWarehouses, w.name] }))} className={cn("rounded-full px-3 py-1 text-sm", userForm.allowedWarehouses.includes(w.name) ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-800")}>{w.name}</button>)}</div></div> : null}
                  <div className="md:col-span-2 xl:col-span-4 flex gap-2"><Button onClick={editingUserId ? () => updateUser(editingUserId) : addUser}>{editingUserId ? "Salva modifiche" : "Aggiungi utente"}</Button>{editingUserId ? <Button variant="outline" onClick={() => { setEditingUserId(null); setUserForm({ username: "", password: "", role: "viewer", name: "", allowedWarehouses: [] }); }}>Annulla</Button> : null}</div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><SectionTitle title="Utenti creati" /></CardHeader>
              <CardContent>
                <div className="space-y-3">{db.users.map((user) => <div key={user.id} className="rounded-2xl border border-slate-200 p-4"><p className="font-semibold">{user.name || user.username}</p><p className="text-sm text-slate-500">Username: {user.username} • Ruolo: {user.role}</p><div className="mt-2"><Button variant="outline" onClick={() => startEditUser(user)}>Modifica</Button></div>{user.role === "viewer" ? <p className="text-xs text-slate-500 mt-1">Magazzini: {user.allowedWarehouses.join(", ") || "Tutti"}</p> : null}</div>)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><SectionTitle title="Parametri a tendina" /></CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                  <div><Label>Nuova categoria prodotto</Label><Input value={settingsForm.productCategory} onChange={(e) => setSettingsForm((p) => ({ ...p, productCategory: e.target.value }))} /><div className="mt-2"><Button variant="outline" onClick={() => { addSettingValue("productCategories", settingsForm.productCategory); setSettingsForm((p) => ({ ...p, productCategory: "" })); }}>Aggiungi</Button></div></div>
                  <div><Label>Nuovo tipo movimento</Label><Input value={settingsForm.movementType} onChange={(e) => setSettingsForm((p) => ({ ...p, movementType: e.target.value }))} /><div className="mt-2"><Button variant="outline" onClick={() => { addSettingValue("movementTypes", settingsForm.movementType); setSettingsForm((p) => ({ ...p, movementType: "" })); }}>Aggiungi</Button></div></div>
                  <div><Label>Nuova unità</Label><Input value={settingsForm.unit} onChange={(e) => setSettingsForm((p) => ({ ...p, unit: e.target.value }))} /><div className="mt-2"><Button variant="outline" onClick={() => { addSettingValue("units", settingsForm.unit); setSettingsForm((p) => ({ ...p, unit: "" })); }}>Aggiungi</Button></div></div>
                  <div><Label>Nuovo tipo lavorazione</Label><Input value={settingsForm.workType} onChange={(e) => setSettingsForm((p) => ({ ...p, workType: e.target.value }))} /><div className="mt-2"><Button variant="outline" onClick={() => { addSettingValue("workTypes", settingsForm.workType); setSettingsForm((p) => ({ ...p, workType: "" })); }}>Aggiungi</Button></div></div>
                  <div><Label>Nuovo allergene</Label><Input value={settingsForm.allergen} onChange={(e) => setSettingsForm((p) => ({ ...p, allergen: e.target.value }))} /><div className="mt-2"><Button variant="outline" onClick={() => { addSettingValue("allergens", settingsForm.allergen); setSettingsForm((p) => ({ ...p, allergen: "" })); }}>Aggiungi</Button></div></div>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5 text-sm text-slate-600">
                  <div><p className="font-semibold text-slate-900 mb-2">Categorie</p><p>{db.settings.productCategories.join(", ")}</p></div>
                  <div><p className="font-semibold text-slate-900 mb-2">Movimenti</p><p>{db.settings.movementTypes.join(", ")}</p></div>
                  <div><p className="font-semibold text-slate-900 mb-2">Unità</p><p>{db.settings.units.join(", ")}</p></div>
                  <div><p className="font-semibold text-slate-900 mb-2">Lavorazioni</p><p>{db.settings.workTypes.join(", ")}</p></div>
                  <div><p className="font-semibold text-slate-900 mb-2">Allergeni</p><p>{db.settings.allergens.join(", ")}</p></div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </>
    ) : (
      <>
        {!viewerPage ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { key: "laboratorio" as const, title: "Visualizzazione laboratorio", icon: Package },
              { key: "vini" as const, title: "Visualizzazione vini", icon: Wine },
              { key: "acquisti" as const, title: "Visualizzazione acquisti", icon: ShoppingCart },
              { key: "menu" as const, title: "Visualizzazione menù", icon: CalendarDays },
            ].map((item) => (
              <button key={item.key} className="text-left" onClick={() => setViewerPage(item.key)}>
                <Card className="h-full hover:shadow-md">
                  <CardContent>
                    <div className="mb-4 inline-flex rounded-2xl bg-slate-100 p-3">
                      <item.icon className="h-5 w-5 text-slate-700" />
                    </div>
                    <p className="font-semibold">{item.title}</p>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        ) : null}

        {viewerPage === "laboratorio" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3"><SectionTitle title="Visualizzazione laboratorio" description="Lotti assegnati al tuo utente" /><Button variant="outline" onClick={() => setViewerPage(null)}>Indietro</Button></div>
            <Card>
              <CardContent>
                <div className="space-y-3">
                  {viewerLots.length === 0 ? <p className="text-sm text-slate-500">Nessun lotto assegnato.</p> : viewerLots.map((lot) => (
                    <div key={lot.id} className="rounded-2xl border border-slate-200 p-4">
                      <p className="font-semibold">{lot.product}</p>
                      <p className="text-sm text-slate-500">{lot.internalBatch} • {lot.quantity} {lot.unit}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {viewerPage === "vini" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3"><SectionTitle title="Visualizzazione vini" description="Consulta la selezione vini" /><Button variant="outline" onClick={() => setViewerPage(null)}>Indietro</Button></div>
            <Card>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {db.wines.map((wine) => (
                    <div key={wine.id} className="rounded-2xl border border-slate-200 p-4">
                      <p className="font-semibold">{wine.name}</p>
                      <p className="text-sm text-slate-500">{wine.winery} • {wine.type}</p>
                      <p className="text-sm text-slate-500">€ {wine.price || "—"} • {wine.stock} bottiglie</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {viewerPage === "acquisti" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3"><SectionTitle title="Visualizzazione acquisti" description="Acquisti collegati al tuo utente" /><Button variant="outline" onClick={() => setViewerPage(null)}>Indietro</Button></div>
            <Input placeholder="Cerca acquisti..." value={search.viewerPurchases} onChange={(e) => setSearch((p) => ({ ...p, viewerPurchases: e.target.value }))} />
            <Card>
              <CardContent>
                <div className="space-y-3">
                  {viewerLots.filter((lot) => JSON.stringify(lot).toLowerCase().includes(search.viewerPurchases.toLowerCase())).length === 0 ? <p className="text-sm text-slate-500">Nessun acquisto collegato a questo utente.</p> : viewerLots.filter((lot) => JSON.stringify(lot).toLowerCase().includes(search.viewerPurchases.toLowerCase())).map((lot) => (
                    <div key={lot.id} className="rounded-2xl border border-slate-200 p-4">
                      <p className="font-semibold">{lot.product}</p>
                      <p className="text-sm text-slate-500">{lot.receivedAt} • {lot.supplier}</p>
                      <p className="text-sm text-slate-500">€ {lot.purchasePrice || "—"} • Totale € {lot.totalValue || "—"} • Scad. {lot.expiry || "—"}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}

        {viewerPage === "menu" ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3"><SectionTitle title="Visualizzazione menù" description="Prodotti settimanali e richieste" /><Button variant="outline" onClick={() => setViewerPage(null)}>Indietro</Button></div>
            <Card>
              <CardHeader><SectionTitle title="Prodotti settimanali" /></CardHeader>
              <CardContent>
                <div className="rounded-2xl border border-slate-200 p-4 whitespace-pre-wrap text-sm text-slate-700">{db.menuProducts || "Nessun prodotto inserito"}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><SectionTitle title="Richiesta modifica menù" /></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <Label>Richiesta</Label>
                    <Textarea value={menuRequestText} onChange={(e) => setMenuRequestText(e.target.value)} />
                  </div>
                  <Button onClick={addMenuRequest}>Invia richiesta</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </>
    )}
  </div>
</div>

); }

