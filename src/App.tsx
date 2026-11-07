import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react'
import { supabase, isSupabaseConfigured } from './lib/supabase'
import type { BorrowingRequest, Equipment, LearningNote, Role, Student } from './types'
import { BookOpen, Boxes, ChefHat, ChevronDown, CircleAlert, ClipboardList, Download, FileSpreadsheet, FileText, GraduationCap, LayoutDashboard, LogOut, Menu, Plus, Search, ShieldCheck, Trash2, Upload, Users, X } from 'lucide-react'
import * as XLSX from 'xlsx'

type Tab = 'overview' | 'students' | 'borrowing' | 'resources'
const primary = 'bg-[#0C16A6] hover:bg-[#111dba] text-white'

function Button({ children, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props}>{children}</button>
}
function Badge({ children, tone = 'gray' }: { children: ReactNode; tone?: string }) {
  const tones: Record<string, string> = { gray: 'bg-slate-100 text-slate-600', purple: 'bg-[#eeeaf3] text-[#5C5676]', teal: 'bg-[#e9f0ef] text-[#647D7B]', yellow: 'bg-amber-100 text-amber-800', blue: 'bg-blue-100 text-[#0C16A6]', red: 'bg-red-100 text-red-700', green: 'bg-green-100 text-green-700' }
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone] ?? tones.gray}`}>{children}</span>
}
function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}><section role="dialog" aria-modal="true" aria-label={title} className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div className="mb-5 flex items-center justify-between"><h2 className="text-lg font-bold text-slate-900">{title}</h2><button aria-label="Tutup" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18}/></button></div>{children}</section></div>
}
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="block space-y-1.5"><span className="text-sm font-medium text-slate-700">{label}</span>{children}</label> }
const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#647D7B] focus:outline-none'
const roleLabel: Record<Role, string> = { student: 'Pelajar', lecturer: 'Pensyarah', admin: 'Pentadbir' }

export default function App() {
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<Role>('student')
  const [tab, setTab] = useState<Tab>('overview')
  const [mobileNav, setMobileNav] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [requests, setRequests] = useState<BorrowingRequest[]>([])
  const [equipment, setEquipment] = useState<Equipment[]>([])
  const [notes, setNotes] = useState<LearningNote[]>([])
  const [query, setQuery] = useState('')
  const [programmeFilter, setProgrammeFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [sessionFilter, setSessionFilter] = useState('')
  const [studentModal, setStudentModal] = useState<Student | null | false>(false)
  const [borrowModal, setBorrowModal] = useState(false)
  const [noteModal, setNoteModal] = useState(false)

  const refresh = useCallback(async () => {
    if (!supabase) { setLoading(false); return }
    setError('')
    const [s, r, e, n] = await Promise.all([
      supabase.from('students').select('*').order('semester').order('full_name'),
      supabase.from('borrowing_requests').select('*, equipment_inventory(name)').order('created_at', { ascending: false }),
      supabase.from('equipment_inventory').select('*').order('name'),
      supabase.from('learning_notes').select('*').order('created_at', { ascending: false }),
    ])
    const failed = [s, r, e, n].find(result => result.error)
    if (failed?.error) setError(failed.error.message)
    if (s.data) setStudents(s.data as Student[])
    if (r.data) setRequests(r.data as BorrowingRequest[])
    if (e.data) setEquipment(e.data as Equipment[])
    if (n.data) setNotes(n.data as LearningNote[])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!supabase) { setLoading(false); return }
    supabase.auth.getSession().then(({ data }) => {
      const current = data.session?.user ?? null
      setUser(current)
      setRole((current?.app_metadata?.role as Role) || 'student')
      if (current) void refresh(); else setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const current = session?.user ?? null
      setUser(current); setRole((current?.app_metadata?.role as Role) || 'student')
      if (current) void refresh(); else { setLoading(false); setStudents([]); setRequests([]); setEquipment([]); setNotes([]) }
    })
    return () => listener.subscription.unsubscribe()
  }, [refresh])

  const isManager = role === 'admin' || role === 'lecturer'
  const programmes = useMemo(() => [...new Set(students.map(s => s.programme))].sort(), [students])
  const sessions = useMemo(() => [...new Set(students.map(s => s.academic_session))].sort(), [students])
  const filteredStudents = useMemo(() => students.filter(s => `${s.full_name} ${s.student_id}`.toLowerCase().includes(query.toLowerCase()) && (!programmeFilter || s.programme === programmeFilter) && (!semesterFilter || String(s.semester) === semesterFilter) && (!sessionFilter || s.academic_session === sessionFilter)), [students, query, programmeFilter, semesterFilter, sessionFilter])
  const filteredNotes = useMemo(() => notes.filter(n => `${n.title} ${n.topic} ${n.course}`.toLowerCase().includes(query.toLowerCase()) && (!semesterFilter || String(n.semester) === semesterFilter)), [notes, query, semesterFilter])
  const filteredRequests = useMemo(() => requests.filter(r => `${r.applicant_name} ${r.applicant_id} ${r.equipment_inventory?.name ?? ''}`.toLowerCase().includes(query.toLowerCase())), [requests, query])

  async function signIn(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!supabase) return
    const data = new FormData(e.currentTarget)
    setBusy(true); setError('')
    const { error: authError } = await supabase.auth.signInWithPassword({ email: String(data.get('email')), password: String(data.get('password')) })
    if (authError) setError(authError.message)
    setBusy(false)
  }
  async function signOut() { await supabase?.auth.signOut(); setUser(null) }
  async function saveStudent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!supabase) return
    const d = new FormData(e.currentTarget)
    const row = { student_id: String(d.get('student_id')).trim(), full_name: String(d.get('full_name')).trim(), programme: String(d.get('programme')).trim(), semester: Number(d.get('semester')), academic_session: String(d.get('academic_session')).trim(), email: String(d.get('email') || '').trim() || null }
    setBusy(true); setError('')
    const { error: saveError } = studentModal && typeof studentModal === 'object' ? await supabase.from('students').update(row).eq('id', studentModal.id) : await supabase.from('students').insert(row)
    if (saveError) setError(saveError.message); else { setStudentModal(false); await refresh() }
    setBusy(false)
  }
  async function deleteStudent(student: Student) {
    if (!supabase || !window.confirm(`Padam rekod ${student.full_name} (${student.student_id})? Tindakan ini tidak boleh dibatalkan.`)) return
    setBusy(true); const { error: removeError } = await supabase.from('students').delete().eq('id', student.id)
    if (removeError) setError(removeError.message); else await refresh(); setBusy(false)
  }
  async function importStudents(file?: File) {
    if (!file || !supabase) return
    setBusy(true); setError('')
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]], { defval: '' })
      const normalized = rows.map(row => {
        const v: Record<string, unknown> = {}; for (const [k, value] of Object.entries(row)) v[k.toLowerCase().replace(/[^a-z0-9]/g, '')] = value
        return { student_id: String(v.studentid ?? v.idpelajar ?? '').trim(), full_name: String(v.fullname ?? v.name ?? v.namapelajar ?? '').trim(), programme: String(v.programme ?? v.program ?? '').trim(), semester: Number(v.semester ?? v.sem), academic_session: String(v.academicsession ?? v.session ?? '').trim(), email: String(v.email ?? '').trim() || null }
      }).filter(row => row.student_id && row.full_name && row.programme && row.semester && row.academic_session)
      if (!normalized.length) throw new Error('Tiada rekod sah. Pastikan lajur: student_id, full_name, programme, semester, academic_session.')
      const { error: importError } = await supabase.from('students').upsert(normalized, { onConflict: 'student_id' })
      if (importError) throw importError
      await refresh()
    } catch (e) { setError(e instanceof Error ? e.message : 'Import gagal.') }
    setBusy(false)
  }
  async function createBorrowing(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!supabase || !user) return
    const d = new FormData(e.currentTarget)
    const item = equipment.find(x => x.id === String(d.get('equipment_id')))
    const quantity = Number(d.get('quantity'))
    if (!item || quantity < 1 || quantity > item.available_quantity) { setError('Kuantiti melebihi stok tersedia. Sila semak inventori.'); return }
    const row = { applicant_user_id: user.id, applicant_name: String(d.get('applicant_name')), applicant_id: String(d.get('applicant_id')), programme: String(d.get('programme')), equipment_id: item.id, quantity, purpose: String(d.get('purpose')), borrowing_date: String(d.get('borrowing_date')), expected_return_date: String(d.get('expected_return_date')), workshop_location: String(d.get('workshop_location')) }
    setBusy(true); setError('')
    const { error: submitError } = await supabase.from('borrowing_requests').insert(row)
    if (submitError) setError(submitError.message); else { setBorrowModal(false); await refresh() }
    setBusy(false)
  }
  async function setRequestStatus(request: BorrowingRequest, status: BorrowingRequest['status']) {
    if (!supabase) return
    setBusy(true); setError('')
    const { error: updateError } = await supabase.from('borrowing_requests').update({ status }).eq('id', request.id)
    if (updateError) setError(updateError.message); else await refresh()
    setBusy(false)
  }
  async function uploadNote(e: FormEvent<HTMLFormElement>) {
    e.preventDefault(); if (!supabase || !user) return
    const d = new FormData(e.currentTarget); const file = d.get('file') as File
    if (!file || !file.size) { setError('Pilih fail untuk dimuat naik.'); return }
    if (file.size > 25 * 1024 * 1024) { setError('Saiz fail maksimum ialah 25 MB.'); return }
    const path = `${user.id}/${crypto.randomUUID()}-${file.name.replace(/[^\w.-]/g, '_')}`
    setBusy(true); setError('')
    const { error: storageError } = await supabase.storage.from('learning-notes').upload(path, file, { contentType: file.type || 'application/octet-stream' })
    if (storageError) { setError(storageError.message); setBusy(false); return }
    const { error: insertError } = await supabase.from('learning_notes').insert({ title: String(d.get('title')), topic: String(d.get('topic')), course: String(d.get('course')), semester: Number(d.get('semester')), programme: String(d.get('programme') || '') || null, file_path: path, file_name: file.name, uploaded_by: user.id })
    if (insertError) { await supabase.storage.from('learning-notes').remove([path]); setError(insertError.message) } else { setNoteModal(false); await refresh() }
    setBusy(false)
  }
  async function downloadNote(note: LearningNote) {
    if (!supabase) return
    const { data, error: downloadError } = await supabase.storage.from('learning-notes').createSignedUrl(note.file_path, 60)
    if (downloadError) setError(downloadError.message); else if (data?.signedUrl) window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
  }

  if (!isSupabaseConfigured) return <main className="grid min-h-screen place-items-center p-5"><div className="max-w-lg rounded-3xl bg-white p-8 shadow-card"><div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-[#0C16A6] text-white"><ChefHat/></div><h1 className="text-2xl font-bold">Sambungkan Supabase</h1><p className="mt-2 text-slate-600">Tetapkan <code>VITE_SUPABASE_URL</code> dan <code>VITE_SUPABASE_ANON_KEY</code> dalam fail <code>.env</code>, kemudian jalankan migrasi <code>supabase/schema.sql</code>.</p></div></main>
  if (!user) return <main className="grid min-h-screen place-items-center bg-gradient-to-br from-[#eef0ff] to-[#f7f8fc] p-5"><form onSubmit={signIn} className="w-full max-w-md rounded-3xl bg-white p-8 shadow-card"><div className="mb-6 grid h-14 w-14 place-items-center rounded-2xl bg-[#0C16A6] text-white"><ChefHat/></div><p className="text-sm font-semibold uppercase tracking-wider text-[#647D7B]">Kolej Vokasional</p><h1 className="mt-1 text-2xl font-bold text-slate-900">Jabatan Seni Kulinari</h1><p className="mb-6 mt-2 text-sm text-slate-500">Portal Pengurusan · Sign in untuk meneruskan</p>{error && <div role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>}<div className="space-y-4"><Field label="E-mel"><input required name="email" type="email" autoComplete="email" className={inputClass} placeholder="nama@kolej.edu.my"/></Field><Field label="Kata laluan"><input required name="password" type="password" autoComplete="current-password" className={inputClass}/></Field><Button disabled={busy} className={`${primary} w-full`}>{busy ? 'Sedang log masuk…' : 'Log masuk'}</Button></div></form></main>

  const nav: { id: Tab; label: string; icon: ReactNode }[] = [{ id: 'overview', label: 'Ringkasan', icon: <LayoutDashboard size={18}/> }, { id: 'students', label: 'Maklumat Pelajar', icon: <Users size={18}/> }, { id: 'borrowing', label: 'Pinjaman Peralatan', icon: <Boxes size={18}/> }, { id: 'resources', label: 'Nota Pembelajaran', icon: <BookOpen size={18}/> }]
  const title = nav.find(n => n.id === tab)?.label ?? 'Ringkasan'
  const statCard = (label: string, value: number | string, icon: ReactNode, accent: string) => <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{label}</span><div className={`grid h-10 w-10 place-items-center rounded-xl ${accent}`}>{icon}</div></div><p className="mt-4 text-3xl font-bold text-slate-900">{value}</p></div>
  const statusTone: Record<string, string> = { pending: 'yellow', approved: 'blue', rejected: 'red', returned: 'green', overdue: 'purple' }
  const statusText: Record<string, string> = { pending: 'Menunggu', approved: 'Diluluskan', rejected: 'Ditolak', returned: 'Dipulangkan', overdue: 'Lewat' }

  return <div className="min-h-screen md:flex">
    {mobileNav && <button aria-label="Tutup menu" className="fixed inset-0 z-20 bg-black/30 md:hidden" onClick={() => setMobileNav(false)}/>}
    <aside className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col bg-white p-5 shadow-xl transition-transform md:static md:translate-x-0 md:shadow-none ${mobileNav ? 'translate-x-0' : '-translate-x-full'}`}><div className="flex items-center gap-3 px-2 py-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#0C16A6] text-white"><ChefHat size={23}/></div><div><p className="font-bold text-slate-900">Seni Kulinari</p><p className="text-xs text-slate-500">Portal Pengurusan</p></div><button className="ml-auto md:hidden" onClick={() => setMobileNav(false)} aria-label="Tutup"><X size={19}/></button></div><div className="my-6 border-t border-slate-100"/><p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400">Menu Utama</p><nav className="mt-3 space-y-1">{nav.map(n => <button key={n.id} onClick={() => { setTab(n.id); setMobileNav(false); setQuery('') }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${tab === n.id ? 'bg-[#0C16A6] text-white shadow-md shadow-blue-900/15' : 'text-slate-600 hover:bg-[#f1eff5]'}`}>{n.icon}{n.label}</button>)}</nav><div className="mt-auto rounded-2xl bg-[#f2f0f7] p-4"><div className="flex items-center gap-2 text-[#5C5676]"><ShieldCheck size={18}/><span className="text-sm font-bold">Akses {roleLabel[role]}</span></div><p className="mt-2 break-all text-xs text-slate-500">{user.email}</p><button onClick={signOut} className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-[#0C16A6]"><LogOut size={14}/> Log keluar</button></div></aside>
    <main className="min-w-0 flex-1"><header className="sticky top-0 z-10 flex h-[76px] items-center justify-between border-b border-slate-100 bg-white/90 px-4 backdrop-blur md:px-8"><div className="flex items-center gap-3"><button className="rounded-lg p-2 hover:bg-slate-100 md:hidden" aria-label="Buka menu" onClick={() => setMobileNav(true)}><Menu size={20}/></button><div><p className="text-xs font-medium text-slate-400">Jabatan Seni Kulinari / {title}</p><h1 className="text-lg font-bold text-slate-900">{title}</h1></div></div><div className="hidden items-center gap-2 rounded-full bg-[#f2f0f7] px-3 py-2 sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-500"/><span className="text-xs font-medium text-slate-600">Sistem aktif</span></div></header>
      <div className="mx-auto max-w-[1440px] p-4 md:p-8">
        {error && <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"><CircleAlert size={18} className="mt-0.5 shrink-0"/><span className="flex-1">{error}</span><button aria-label="Tutup mesej" onClick={() => setError('')}><X size={16}/></button></div>}
        {loading ? <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500"><span className="h-5 w-5 animate-spin rounded-full border-2 border-[#0C16A6] border-t-transparent"/>Memuatkan data…</div> : <>
        {tab === 'overview' && <><div className="mb-7 rounded-3xl bg-gradient-to-r from-[#0C16A6] to-[#363fc1] p-6 text-white md:p-8"><p className="text-sm text-blue-100">Selamat datang, {user.user_metadata?.full_name || user.email?.split('@')[0]} 👋</p><h2 className="mt-2 text-2xl font-bold md:text-3xl">Pengurusan Jabatan Seni Kulinari</h2><p className="mt-2 max-w-2xl text-sm text-blue-100">Satu ruang untuk mengurus rekod pelajar, permohonan pinjaman bengkel dan bahan pembelajaran.</p></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{statCard('Jumlah Pelajar', students.length, <GraduationCap className="text-[#0C16A6]"/>, 'bg-blue-50')}{statCard('Permohonan Menunggu', requests.filter(r => r.status === 'pending').length, <ClipboardList className="text-amber-700"/>, 'bg-amber-50')}{statCard('Peralatan Inventori', equipment.length, <Boxes className="text-[#647D7B]"/>, 'bg-[#e9f0ef]')}{statCard('Nota Pembelajaran', notes.length, <BookOpen className="text-[#5C5676]"/>, 'bg-[#eeeaf3]')}</div><div className="mt-6 grid gap-5 lg:grid-cols-2"><section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card"><h3 className="font-bold">Permohonan terkini</h3><div className="mt-4 space-y-3">{requests.slice(0, 4).map(r => <div key={r.id} className="flex items-center justify-between gap-3 border-b border-slate-50 pb-3 last:border-0"><div className="min-w-0"><p className="truncate text-sm font-semibold">{r.applicant_name}</p><p className="text-xs text-slate-500">{r.equipment_inventory?.name ?? 'Peralatan'} · {r.quantity} unit</p></div><Badge tone={statusTone[r.status]}>{statusText[r.status]}</Badge></div>)}{requests.length === 0 && <p className="py-4 text-sm text-slate-500">Belum ada permohonan.</p>}</div></section><section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card"><h3 className="font-bold">Akses pantas</h3><div className="mt-4 grid grid-cols-2 gap-3">{nav.slice(1).map(n => <button key={n.id} onClick={() => setTab(n.id)} className="flex min-h-24 flex-col items-start justify-between rounded-xl border border-slate-100 p-4 text-left text-sm font-semibold text-slate-700 transition hover:border-[#B5A8C2] hover:bg-[#f7f5fa]">{n.icon}{n.label}</button>)}</div></section></div></>}

        {tab === 'students' && <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card md:p-6"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center"><div><h2 className="text-lg font-bold">Maklumat Pelajar</h2><p className="mt-1 text-sm text-slate-500">Rekod mengikut program, semester dan sesi akademik.</p></div>{isManager && <div className="flex flex-wrap gap-2"><label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 ${busy ? 'opacity-50' : ''}`}><FileSpreadsheet size={16}/> Import CSV / Excel<input type="file" accept=".csv,.xlsx,.xls" className="hidden" disabled={busy} onChange={e => { void importStudents(e.target.files?.[0]); e.currentTarget.value = '' }}/></label><Button onClick={() => setStudentModal(null)} className={primary}><Plus size={16}/> Tambah pelajar</Button></div>}</div><div className="my-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><div className="relative"><Search size={16} className="absolute left-3 top-3 text-slate-400"/><input value={query} onChange={e => setQuery(e.target.value)} className={`${inputClass} pl-9`} placeholder="Cari nama atau ID…"/></div><select aria-label="Tapis program" value={programmeFilter} onChange={e => setProgrammeFilter(e.target.value)} className={inputClass}><option value="">Semua program</option>{programmes.map(p => <option key={p}>{p}</option>)}</select><select aria-label="Tapis semester" value={semesterFilter} onChange={e => setSemesterFilter(e.target.value)} className={inputClass}><option value="">Semua semester</option>{[1,2,3,4,5,6].map(s => <option key={s} value={s}>Semester {s}</option>)}</select><select aria-label="Tapis sesi" value={sessionFilter} onChange={e => setSessionFilter(e.target.value)} className={inputClass}><option value="">Semua sesi akademik</option>{sessions.map(s => <option key={s}>{s}</option>)}</select></div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400"><th className="px-3 py-3">Nama pelajar</th><th className="px-3 py-3">ID pelajar</th><th className="px-3 py-3">Program</th><th className="px-3 py-3">Semester</th><th className="px-3 py-3">Sesi akademik</th>{isManager && <th className="px-3 py-3">Tindakan</th>}</tr></thead><tbody>{filteredStudents.map(s => <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50"><td className="px-3 py-3.5 font-semibold text-slate-800">{s.full_name}</td><td className="px-3 py-3.5 text-slate-600">{s.student_id}</td><td className="px-3 py-3.5"><Badge tone="teal">{s.programme}</Badge></td><td className="px-3 py-3.5">Semester {s.semester}</td><td className="px-3 py-3.5">{s.academic_session}</td>{isManager && <td className="px-3 py-3.5"><div className="flex gap-2"><button className="text-xs font-semibold text-[#0C16A6]" onClick={() => setStudentModal(s)}>Edit</button><button aria-label={`Padam ${s.full_name}`} className="text-red-600" onClick={() => void deleteStudent(s)}><Trash2 size={15}/></button></div></td>}</tr>)}</tbody></table>{filteredStudents.length === 0 && <p className="py-12 text-center text-sm text-slate-500">Tiada rekod pelajar ditemui.</p>}</div><p className="mt-4 text-xs text-slate-400">{filteredStudents.length} rekod dipaparkan</p></section>}

        {tab === 'borrowing' && <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card md:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-lg font-bold">Permohonan Pinjaman Peralatan</h2><p className="mt-1 text-sm text-slate-500">Semak status pinjaman dan ketersediaan stok bengkel.</p></div><Button onClick={() => setBorrowModal(true)} className={primary}><Plus size={16}/> Permohonan baharu</Button></div><div className="relative my-5 max-w-sm"><Search size={16} className="absolute left-3 top-3 text-slate-400"/><input value={query} onChange={e => setQuery(e.target.value)} className={`${inputClass} pl-9`} placeholder="Cari pemohon atau peralatan…"/></div><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400"><th className="px-3 py-3">Pemohon</th><th className="px-3 py-3">Peralatan</th><th className="px-3 py-3">Kuantiti</th><th className="px-3 py-3">Tarikh pinjam / pulang</th><th className="px-3 py-3">Lokasi</th><th className="px-3 py-3">Status</th>{isManager && <th className="px-3 py-3">Keputusan</th>}</tr></thead><tbody>{filteredRequests.map(r => <tr key={r.id} className="border-b border-slate-50"><td className="px-3 py-3"><p className="font-semibold">{r.applicant_name}</p><p className="text-xs text-slate-500">{r.applicant_id} · {r.programme}</p></td><td className="px-3 py-3">{r.equipment_inventory?.name ?? 'Peralatan'}</td><td className="px-3 py-3">{r.quantity}</td><td className="px-3 py-3">{r.borrowing_date}<p className="text-xs text-slate-500">hingga {r.expected_return_date}</p></td><td className="px-3 py-3">{r.workshop_location}</td><td className="px-3 py-3"><Badge tone={statusTone[r.status]}>{statusText[r.status]}</Badge></td>{isManager && <td className="px-3 py-3">{r.status === 'pending' ? <div className="flex gap-2"><button disabled={busy} onClick={() => void setRequestStatus(r, 'approved')} className="text-xs font-bold text-emerald-700">Lulus</button><button disabled={busy} onClick={() => void setRequestStatus(r, 'rejected')} className="text-xs font-bold text-red-600">Tolak</button></div> : r.status === 'approved' ? <button disabled={busy} onClick={() => void setRequestStatus(r, 'returned')} className="text-xs font-semibold text-[#0C16A6]">Tandakan dipulangkan</button> : '—'}</td>}</tr>)}</tbody></table>{filteredRequests.length === 0 && <p className="py-12 text-center text-sm text-slate-500">Tiada permohonan ditemui.</p>}</div></section>}

        {tab === 'resources' && <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card md:p-6"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-lg font-bold">Bank Nota Pembelajaran</h2><p className="mt-1 text-sm text-slate-500">Bahan pembelajaran mengikut semester dan kursus.</p></div>{isManager && <Button onClick={() => setNoteModal(true)} className={primary}><Upload size={16}/> Muat naik nota</Button>}</div><div className="my-5 grid gap-3 sm:grid-cols-2"><div className="relative"><Search size={16} className="absolute left-3 top-3 text-slate-400"/><input value={query} onChange={e => setQuery(e.target.value)} className={`${inputClass} pl-9`} placeholder="Cari tajuk, topik atau kursus…"/></div><select aria-label="Tapis semester nota" value={semesterFilter} onChange={e => setSemesterFilter(e.target.value)} className={inputClass}><option value="">Semua semester</option>{[1,2,3,4,5,6].map(s => <option key={s} value={s}>Semester {s}</option>)}</select></div>{filteredNotes.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filteredNotes.map(n => <article key={n.id} className="rounded-2xl border border-slate-100 p-5 transition hover:border-[#B5A8C2] hover:shadow-card"><div className="flex items-start justify-between"><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#f2f0f7] text-[#5C5676]"><FileText size={20}/></div><Badge tone="purple">Semester {n.semester}</Badge></div><h3 className="mt-4 font-bold text-slate-900">{n.title}</h3><p className="mt-1 text-sm text-slate-500">{n.course}</p><p className="mt-3 line-clamp-2 text-sm text-slate-600">{n.topic}</p><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><span className="max-w-[65%] truncate text-xs text-slate-400">{n.file_name}</span><button onClick={() => void downloadNote(n)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0C16A6]"><Download size={15}/> Muat turun</button></div></article>)}</div> : <div className="py-16 text-center"><BookOpen className="mx-auto text-slate-300" size={32}/><p className="mt-3 text-sm text-slate-500">Tiada nota dijumpai.</p></div>}</section>}
        </>}
      </div>
    </main>

    {studentModal !== false && <Modal title={studentModal ? 'Kemaskini rekod pelajar' : 'Tambah pelajar'} onClose={() => setStudentModal(false)}><form onSubmit={e => void saveStudent(e)} className="space-y-4"><Field label="Nama penuh"><input required name="full_name" defaultValue={studentModal?.full_name} className={inputClass}/></Field><Field label="ID pelajar"><input required name="student_id" defaultValue={studentModal?.student_id} className={inputClass}/></Field><Field label="E-mel (pilihan)"><input name="email" type="email" defaultValue={studentModal?.email ?? ''} className={inputClass}/></Field><Field label="Program"><input required name="programme" defaultValue={studentModal?.programme} placeholder="Diploma Seni Kulinari" className={inputClass}/></Field><div className="grid grid-cols-2 gap-3"><Field label="Semester"><select required name="semester" defaultValue={studentModal?.semester ?? 1} className={inputClass}>{[1,2,3,4,5,6].map(s => <option key={s} value={s}>{s}</option>)}</select></Field><Field label="Sesi akademik"><input required name="academic_session" defaultValue={studentModal?.academic_session} placeholder="2025/2026" className={inputClass}/></Field></div><div className="flex justify-end gap-2 pt-2"><Button type="button" onClick={() => setStudentModal(false)} className="border border-slate-200 text-slate-700">Batal</Button><Button disabled={busy} className={primary}>{busy ? 'Menyimpan…' : 'Simpan rekod'}</Button></div></form></Modal>}
    {borrowModal && <Modal title="Borang permohonan pinjaman" onClose={() => setBorrowModal(false)}><form onSubmit={e => void createBorrowing(e)} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><Field label="Nama pemohon"><input required name="applicant_name" defaultValue={user.user_metadata?.full_name ?? ''} className={inputClass}/></Field><Field label="ID pemohon"><input required name="applicant_id" className={inputClass}/></Field><Field label="Program"><input required name="programme" className={inputClass}/></Field><Field label="Peralatan"><select required name="equipment_id" className={inputClass}><option value="">Pilih peralatan</option>{equipment.map(item => <option key={item.id} value={item.id} disabled={item.available_quantity < 1}>{item.name} — stok {item.available_quantity}</option>)}</select></Field><Field label="Kuantiti"><input required name="quantity" type="number" min="1" defaultValue="1" className={inputClass}/></Field><Field label="Lokasi bengkel"><input required name="workshop_location" className={inputClass}/></Field><Field label="Tarikh pinjaman"><input required name="borrowing_date" type="date" min={new Date().toISOString().slice(0,10)} className={inputClass}/></Field><Field label="Tarikh jangka pulang"><input required name="expected_return_date" type="date" min={new Date().toISOString().slice(0,10)} className={inputClass}/></Field></div><Field label="Tujuan pinjaman"><textarea required name="purpose" rows={3} className={inputClass}/></Field><p className="text-xs text-slate-500">Stok disahkan semula secara atomik apabila permohonan diluluskan.</p><div className="flex justify-end gap-2"><Button type="button" onClick={() => setBorrowModal(false)} className="border border-slate-200 text-slate-700">Batal</Button><Button disabled={busy} className={primary}>{busy ? 'Menghantar…' : 'Hantar permohonan'}</Button></div></form></Modal>}
    {noteModal && <Modal title="Muat naik bahan pembelajaran" onClose={() => setNoteModal(false)}><form onSubmit={e => void uploadNote(e)} className="space-y-4"><Field label="Tajuk"><input required name="title" className={inputClass}/></Field><Field label="Kursus"><input required name="course" placeholder="Food Preparation, Pastry and Bakery…" className={inputClass}/></Field><Field label="Topik / penerangan"><textarea required name="topic" rows={2} className={inputClass}/></Field><div className="grid grid-cols-2 gap-3"><Field label="Semester"><select required name="semester" className={inputClass}>{[1,2,3,4,5,6].map(s => <option key={s} value={s}>{s}</option>)}</select></Field><Field label="Program (pilihan)"><input name="programme" className={inputClass}/></Field></div><Field label="Fail (PDF, slaid atau bahan lain · maks. 25 MB)"><input required name="file" type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png" className={inputClass}/></Field><div className="flex justify-end gap-2"><Button type="button" onClick={() => setNoteModal(false)} className="border border-slate-200 text-slate-700">Batal</Button><Button disabled={busy} className={primary}>{busy ? 'Memuat naik…' : 'Muat naik nota'}</Button></div></form></Modal>}
  </div>
}
