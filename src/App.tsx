import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import type { BorrowingRequest, Equipment, LearningNote, Role, Student } from './types'
import { BookOpen, Boxes, ChefHat, CircleAlert, ClipboardList, Download, FileSpreadsheet, FileText, GraduationCap, LayoutDashboard, Menu, Plus, Search, ShieldCheck, Trash2, Upload, Users, X } from 'lucide-react'
import * as XLSX from 'xlsx'

type Tab = 'overview' | 'students' | 'borrowing' | 'resources'
const primary = 'bg-[#0C16A6] hover:bg-[#111dba] text-white'
const demoUser = { id: 'local-demo-user', email: 'demo@jabatan.edu.my', user_metadata: { full_name: 'Pengguna Demo' } }

const seedStudents: Student[] = [
  { id: 'stu-001', student_id: 'DCS2023001', full_name: 'Aisyah Binti Rahman', programme: 'Diploma Seni Kulinari', semester: 3, academic_session: '2025/2026', email: 'aisyah@example.edu.my' },
  { id: 'stu-002', student_id: 'DCS2023014', full_name: 'Farhan Bin Abdullah', programme: 'Diploma Seni Kulinari', semester: 2, academic_session: '2025/2026', email: 'farhan@example.edu.my' },
  { id: 'stu-003', student_id: 'SKK2022048', full_name: 'Nurul Izzati Binti Hassan', programme: 'Sijil Kemahiran Kulinari', semester: 4, academic_session: '2025/2026' },
  { id: 'stu-004', student_id: 'DCS2023057', full_name: 'Hafizul Bin Ismail', programme: 'Diploma Seni Kulinari', semester: 1, academic_session: '2025/2026', email: 'hafizul@example.edu.my' },
  { id: 'stu-005', student_id: 'DCS2022103', full_name: 'Siti Mariam Binti Yusof', programme: 'Diploma Seni Kulinari', semester: 5, academic_session: '2024/2025' },
  { id: 'stu-006', student_id: 'SKK2023019', full_name: 'Amirul Bin Zulkifli', programme: 'Sijil Kemahiran Kulinari', semester: 2, academic_session: '2025/2026' },
]

const seedEquipment: Equipment[] = [
  { id: 'eq-001', name: 'Oven konveksi', available_quantity: 4, total_quantity: 4 },
  { id: 'eq-002', name: 'Pengadun stand', available_quantity: 1, total_quantity: 2 },
  { id: 'eq-003', name: 'Pengukir sayur', available_quantity: 8, total_quantity: 8 },
  { id: 'eq-004', name: 'Penimbang digital', available_quantity: 5, total_quantity: 6 },
  { id: 'eq-005', name: 'Food processor', available_quantity: 0, total_quantity: 1 },
]

const seedRequests: BorrowingRequest[] = [
  { id: 'req-001', applicant_name: 'Aisyah Binti Rahman', applicant_id: 'DCS2023001', programme: 'Diploma Seni Kulinari', equipment_id: 'eq-001', quantity: 1, purpose: 'Latihan pembuatan roti untuk projek kuliah', borrowing_date: '2026-11-10', expected_return_date: '2026-11-12', workshop_location: 'Bengkel Bakeri 1', status: 'pending', created_at: '2026-11-05T09:30:00.000Z' },
  { id: 'req-002', applicant_name: 'Nurul Izzati Binti Hassan', applicant_id: 'SKK2022048', programme: 'Sijil Kemahiran Kulinari', equipment_id: 'eq-002', quantity: 1, purpose: 'Kelas demonstrasi penyediaan kek', borrowing_date: '2026-11-08', expected_return_date: '2026-11-09', workshop_location: 'Bengkel Pastri', status: 'approved', created_at: '2026-11-04T11:00:00.000Z' },
  { id: 'req-003', applicant_name: 'Hafizul Bin Ismail', applicant_id: 'DCS2023057', programme: 'Diploma Seni Kulinari', equipment_id: 'eq-004', quantity: 2, purpose: 'Projek penghasilan makanan asas', borrowing_date: '2026-11-07', expected_return_date: '2026-11-08', workshop_location: 'Bengkel Kulinari 2', status: 'returned', created_at: '2026-11-03T08:15:00.000Z' },
  { id: 'req-004', applicant_name: 'Amirul Bin Zulkifli', applicant_id: 'SKK2023019', programme: 'Sijil Kemahiran Kulinari', equipment_id: 'eq-005', quantity: 1, purpose: 'Latihan pemotongan dan pemprosesan bahan', borrowing_date: '2026-11-09', expected_return_date: '2026-11-11', workshop_location: 'Bengkel Masakan', status: 'pending', created_at: '2026-11-06T14:20:00.000Z' },
]

const seedNotes: LearningNote[] = [
  { id: 'note-001', title: 'Panduan asas persediaan makanan', topic: 'Kebersihan, pemotongan dan penyimpanan bahan mentah', course: 'Food Preparation', programme: 'Diploma Seni Kulinari', semester: 1, file_path: '', file_name: 'Panduan-asas.pdf', created_at: '2026-10-18T08:00:00.000Z' },
  { id: 'note-002', title: 'Teknik pembuatan sos asas', topic: 'Roux, espagnole dan derived sauces', course: 'Culinary Skills', programme: 'Diploma Seni Kulinari', semester: 3, file_path: '', file_name: 'Sos-asas.pptx', created_at: '2026-10-22T10:30:00.000Z' },
  { id: 'note-003', title: 'Standard kebersihan dapur', topic: 'Prosedur sanitasi dan kawalan HACCP asas', course: 'Food Safety', programme: null, semester: 2, file_path: '', file_name: 'Kebersihan-dapur.pdf', created_at: '2026-10-25T13:10:00.000Z' },
]

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

function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1.5"><span className="text-sm font-medium text-slate-700">{label}</span>{children}</label>
}

const inputClass = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-[#647D7B] focus:outline-none'
const roleLabel: Record<Role, string> = { student: 'Pelajar', lecturer: 'Pensyarah', admin: 'Pentadbir' }

export default function App() {
  const role: Role = 'admin'
  const [tab, setTab] = useState<Tab>('overview')
  const [mobileNav, setMobileNav] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [students, setStudents] = useState<Student[]>(seedStudents)
  const [requests, setRequests] = useState<BorrowingRequest[]>(seedRequests)
  const [equipment, setEquipment] = useState<Equipment[]>(seedEquipment)
  const [notes, setNotes] = useState<LearningNote[]>(seedNotes)
  const [query, setQuery] = useState('')
  const [programmeFilter, setProgrammeFilter] = useState('')
  const [semesterFilter, setSemesterFilter] = useState('')
  const [sessionFilter, setSessionFilter] = useState('')
  const [studentModal, setStudentModal] = useState<Student | null | false>(false)
  const [borrowModal, setBorrowModal] = useState(false)
  const [noteModal, setNoteModal] = useState(false)

  const isManager = role === 'admin' || role === 'lecturer'
  const programmes = useMemo(() => [...new Set(students.map(s => s.programme))].sort(), [students])
  const sessions = useMemo(() => [...new Set(students.map(s => s.academic_session))].sort(), [students])
  const filteredStudents = useMemo(() => students.filter(s => `${s.full_name} ${s.student_id}`.toLowerCase().includes(query.toLowerCase()) && (!programmeFilter || s.programme === programmeFilter) && (!semesterFilter || String(s.semester) === semesterFilter) && (!sessionFilter || s.academic_session === sessionFilter)), [students, query, programmeFilter, semesterFilter, sessionFilter])
  const filteredNotes = useMemo(() => notes.filter(n => `${n.title} ${n.topic} ${n.course}`.toLowerCase().includes(query.toLowerCase()) && (!semesterFilter || String(n.semester) === semesterFilter)), [notes, query, semesterFilter])
  const equipmentName = (equipmentId: string) => equipment.find(item => item.id === equipmentId)?.name ?? 'Peralatan'
  const filteredRequests = useMemo(() => requests.filter(r => `${r.applicant_name} ${r.applicant_id} ${equipmentName(r.equipment_id)}`.toLowerCase().includes(query.toLowerCase())), [requests, query, equipment])
  const editingStudent = typeof studentModal === 'object' ? studentModal : null

  function saveStudent(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const row = {
      student_id: String(data.get('student_id')).trim(),
      full_name: String(data.get('full_name')).trim(),
      programme: String(data.get('programme')).trim(),
      semester: Number(data.get('semester')),
      academic_session: String(data.get('academic_session')).trim(),
      email: String(data.get('email') || '').trim() || null,
    }
    setStudents(current => editingStudent
      ? current.map(student => student.id === editingStudent.id ? { ...student, ...row } : student)
      : [...current, { ...row, id: crypto.randomUUID() }])
    setStudentModal(false)
  }

  function deleteStudent(student: Student) {
    if (!window.confirm(`Padam rekod ${student.full_name} (${student.student_id})? Tindakan ini tidak boleh dibatalkan.`)) return
    setStudents(current => current.filter(item => item.id !== student.id))
  }

  async function importStudents(file?: File) {
    if (!file) return
    setBusy(true); setError('')
    try {
      const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[workbook.SheetNames[0]], { defval: '' })
      const normalized = rows.map(row => {
        const values: Record<string, unknown> = {}
        for (const [key, value] of Object.entries(row)) values[key.toLowerCase().replace(/[^a-z0-9]/g, '')] = value
        return {
          student_id: String(values.studentid ?? values.idpelajar ?? '').trim(),
          full_name: String(values.fullname ?? values.name ?? values.namapelajar ?? '').trim(),
          programme: String(values.programme ?? values.program ?? '').trim(),
          semester: Number(values.semester ?? values.sem),
          academic_session: String(values.academicsession ?? values.session ?? '').trim(),
          email: String(values.email ?? '').trim() || null,
        }
      }).filter(row => row.student_id && row.full_name && row.programme && row.semester && row.academic_session)
      if (!normalized.length) throw new Error('Tiada rekod sah. Pastikan lajur: student_id, full_name, programme, semester, academic_session.')
      setStudents(current => {
        const merged = new Map(current.map(student => [student.student_id, student]))
        normalized.forEach(row => {
          const existing = merged.get(row.student_id)
          merged.set(row.student_id, { ...existing, ...row, id: existing?.id ?? crypto.randomUUID() })
        })
        return [...merged.values()]
      })
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Import gagal.')
    }
    setBusy(false)
  }

  function createBorrowing(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const item = equipment.find(entry => entry.id === String(data.get('equipment_id')))
    const quantity = Number(data.get('quantity'))
    if (!item || quantity < 1 || quantity > item.available_quantity) {
      setError('Kuantiti melebihi stok tersedia. Sila semak inventori.')
      return
    }
    const request: BorrowingRequest = {
      id: crypto.randomUUID(),
      applicant_name: String(data.get('applicant_name')),
      applicant_id: String(data.get('applicant_id')),
      programme: String(data.get('programme')),
      equipment_id: item.id,
      quantity,
      purpose: String(data.get('purpose')),
      borrowing_date: String(data.get('borrowing_date')),
      expected_return_date: String(data.get('expected_return_date')),
      workshop_location: String(data.get('workshop_location')),
      status: 'pending',
      created_at: new Date().toISOString(),
    }
    setRequests(current => [request, ...current])
    setBorrowModal(false)
    setError('')
  }

  function setRequestStatus(request: BorrowingRequest, status: BorrowingRequest['status']) {
    const wasApproved = request.status === 'approved'
    const willBeApproved = status === 'approved'
    if (!wasApproved && willBeApproved) {
      const item = equipment.find(entry => entry.id === request.equipment_id)
      if (!item || item.available_quantity < request.quantity) {
        setError('Stok tidak mencukupi untuk meluluskan permohonan ini.')
        return
      }
    }
    setRequests(current => current.map(item => item.id === request.id ? { ...item, status } : item))
    setEquipment(current => current.map(item => {
      if (item.id !== request.equipment_id) return item
      const restored = wasApproved && !willBeApproved ? request.quantity : 0
      const reserved = !wasApproved && willBeApproved ? request.quantity : 0
      return { ...item, available_quantity: Math.min(item.total_quantity, Math.max(0, item.available_quantity + restored - reserved)) }
    }))
    setError('')
  }

  function uploadNote(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const file = data.get('file') as File | null
    if (!file?.size) { setError('Pilih fail untuk dimuat naik.'); return }
    if (file.size > 25 * 1024 * 1024) { setError('Saiz fail maksimum ialah 25 MB.'); return }
    const note: LearningNote = {
      id: crypto.randomUUID(),
      title: String(data.get('title')),
      topic: String(data.get('topic')),
      course: String(data.get('course')),
      semester: Number(data.get('semester')),
      programme: String(data.get('programme') || '') || null,
      file_path: URL.createObjectURL(file),
      file_name: file.name,
      created_at: new Date().toISOString(),
    }
    setNotes(current => [note, ...current])
    setNoteModal(false)
    setError('')
  }

  function downloadNote(note: LearningNote) {
    if (note.file_path) window.open(note.file_path, '_blank', 'noopener,noreferrer')
  }

  const nav: { id: Tab; label: string; icon: ReactNode }[] = [
    { id: 'overview', label: 'Ringkasan', icon: <LayoutDashboard size={18}/> },
    { id: 'students', label: 'Maklumat Pelajar', icon: <Users size={18}/> },
    { id: 'borrowing', label: 'Pinjaman Peralatan', icon: <Boxes size={18}/> },
    { id: 'resources', label: 'Nota Pembelajaran', icon: <BookOpen size={18}/> },
  ]
  const title = nav.find(item => item.id === tab)?.label ?? 'Ringkasan'
  const statCard = (label: string, value: number | string, icon: ReactNode, accent: string) => <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{label}</span><div className={`grid h-10 w-10 place-items-center rounded-xl ${accent}`}>{icon}</div></div><p className="mt-4 text-3xl font-bold text-slate-900">{value}</p></div>
  const statusTone: Record<string, string> = { pending: 'yellow', approved: 'blue', rejected: 'red', returned: 'green', overdue: 'purple' }
  const statusText: Record<string, string> = { pending: 'Menunggu', approved: 'Diluluskan', rejected: 'Ditolak', returned: 'Dipulangkan', overdue: 'Lewat' }

  return <div className="min-h-screen md:flex">
    {mobileNav && <button aria-label="Tutup menu" className="fixed inset-0 z-20 bg-black/30 md:hidden" onClick={() => setMobileNav(false)}/>}
    <aside className={`fixed inset-y-0 left-0 z-30 flex w-72 flex-col bg-white p-5 shadow-xl transition-transform md:static md:translate-x-0 md:shadow-none ${mobileNav ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center gap-3 px-2 py-3"><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#0C16A6] text-white"><ChefHat size={23}/></div><div><p className="font-bold text-slate-900">Seni Kulinari</p><p className="text-xs text-slate-500">Portal Pengurusan</p></div><button className="ml-auto md:hidden" onClick={() => setMobileNav(false)} aria-label="Tutup"><X size={19}/></button></div>
      <div className="my-6 border-t border-slate-100"/><p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400">Menu Utama</p>
      <nav className="mt-3 space-y-1">{nav.map(item => <button key={item.id} onClick={() => { setTab(item.id); setMobileNav(false); setQuery('') }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${tab === item.id ? 'bg-[#0C16A6] text-white shadow-md shadow-blue-900/15' : 'text-slate-600 hover:bg-[#f1eff5]'}`}>{item.icon}{item.label}</button>)}</nav>
      <div className="mt-auto rounded-2xl bg-[#f2f0f7] p-4"><div className="flex items-center gap-2 text-[#5C5676]"><ShieldCheck size={18}/><span className="text-sm font-bold">Akses {roleLabel[role]}</span></div><p className="mt-2 break-all text-xs text-slate-500">{demoUser.email}</p><p className="mt-2 text-xs font-medium text-slate-400">Data demo disimpan dalam memori.</p></div>
    </aside>
    <main className="min-w-0 flex-1">
      <header className="sticky top-0 z-10 flex h-[76px] items-center justify-between border-b border-slate-100 bg-white/90 px-4 backdrop-blur md:px-8"><div className="flex items-center gap-3"><button className="rounded-lg p-2 hover:bg-slate-100 md:hidden" aria-label="Buka menu" onClick={() => setMobileNav(true)}><Menu size={20}/></button><div><p className="text-xs font-medium text-slate-400">Jabatan Seni Kulinari / {title}</p><h1 className="text-lg font-bold text-slate-900">{title}</h1></div></div><div className="hidden items-center gap-2 rounded-full bg-[#f2f0f7] px-3 py-2 sm:flex"><span className="h-2 w-2 rounded-full bg-emerald-500"/><span className="text-xs font-medium text-slate-600">Mod tempatan aktif</span></div></header>
      <div className="mx-auto max-w-[1440px] p-4 md:p-8">
        {error && <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700"><CircleAlert size={18} className="mt-0.5 shrink-0"/><span className="flex-1">{error}</span><button aria-label="Tutup mesej" onClick={() => setError('')}><X size={16}/></button></div>}

        {tab === 'overview' && <>
          <div className="mb-7 rounded-3xl bg-gradient-to-r from-[#0C16A6] to-[#363fc1] p-6 text-white md:p-8"><p className="text-sm text-blue-100">Selamat datang, {demoUser.user_metadata.full_name} 👋</p><h2 className="mt-2 text-2xl font-bold md:text-3xl">Pengurusan Jabatan Seni Kulinari</h2><p className="mt-2 max-w-2xl text-sm text-blue-100">Satu ruang untuk mengurus rekod pelajar, permohonan pinjaman bengkel dan bahan pembelajaran.</p></div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{statCard('Jumlah Pelajar', students.length, <GraduationCap className="text-[#0C16A6]"/>, 'bg-blue-50')}{statCard('Permohonan Menunggu', requests.filter(request => request.status === 'pending').length, <ClipboardList className="text-amber-700"/>, 'bg-amber-50')}{statCard('Peralatan Inventori', equipment.length, <Boxes className="text-[#647D7B]"/>, 'bg-[#e9f0ef]')}{statCard('Nota Pembelajaran', notes.length, <BookOpen className="text-[#5C5676]"/>, 'bg-[#eeeaf3]')}</div>
          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card"><h3 className="font-bold">Permohonan terkini</h3><div className="mt-4 space-y-3">{requests.slice(0, 4).map(request => <div key={request.id} className="flex items-center justify-between gap-3 border-b border-slate-50 pb-3 last:border-0"><div className="min-w-0"><p className="truncate text-sm font-semibold">{request.applicant_name}</p><p className="text-xs text-slate-500">{equipmentName(request.equipment_id)} · {request.quantity} unit</p></div><Badge tone={statusTone[request.status]}>{statusText[request.status]}</Badge></div>)}{requests.length === 0 && <p className="py-4 text-sm text-slate-500">Belum ada permohonan.</p>}</div></section>
            <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-card"><h3 className="font-bold">Akses pantas</h3><div className="mt-4 grid grid-cols-2 gap-3">{nav.slice(1).map(item => <button key={item.id} onClick={() => setTab(item.id)} className="flex items-center gap-3 rounded-2xl border border-slate-100 p-4 text-left text-sm font-semibold text-slate-700 transition hover:border-[#B5A8C2] hover:bg-[#faf9fc]"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#f2f0f7] text-[#5C5676]">{item.icon}</span>{item.label}</button>)}</div></section>
          </div>
        </>}

        {tab === 'students' && <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card md:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center"><div><h2 className="text-lg font-bold">Maklumat Pelajar</h2><p className="mt-1 text-sm text-slate-500">Rekod mengikut program, semester dan sesi akademik.</p></div>{isManager && <div className="flex flex-wrap gap-2"><label className={`inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 ${busy ? 'opacity-50' : ''}`}><FileSpreadsheet size={16}/> Import CSV / Excel<input type="file" accept=".csv,.xlsx,.xls" className="hidden" disabled={busy} onChange={e => { void importStudents(e.target.files?.[0]); e.currentTarget.value = '' }}/></label><Button onClick={() => setStudentModal(null)} className={primary}><Plus size={16}/> Tambah pelajar</Button></div>}</div>
          <div className="my-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><div className="relative"><Search size={16} className="absolute left-3 top-3 text-slate-400"/><input value={query} onChange={e => setQuery(e.target.value)} className={`${inputClass} pl-9`} placeholder="Cari nama atau ID…"/></div><select aria-label="Tapis program" value={programmeFilter} onChange={e => setProgrammeFilter(e.target.value)} className={inputClass}><option value="">Semua program</option>{programmes.map(programme => <option key={programme}>{programme}</option>)}</select><select aria-label="Tapis semester" value={semesterFilter} onChange={e => setSemesterFilter(e.target.value)} className={inputClass}><option value="">Semua semester</option>{[1,2,3,4,5,6].map(semester => <option key={semester} value={semester}>Semester {semester}</option>)}</select><select aria-label="Tapis sesi" value={sessionFilter} onChange={e => setSessionFilter(e.target.value)} className={inputClass}><option value="">Semua sesi akademik</option>{sessions.map(session => <option key={session}>{session}</option>)}</select></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead><tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400"><th className="px-3 py-3">Nama pelajar</th><th className="px-3 py-3">ID pelajar</th><th className="px-3 py-3">Program</th><th className="px-3 py-3">Semester</th><th className="px-3 py-3">Sesi akademik</th>{isManager && <th className="px-3 py-3">Tindakan</th>}</tr></thead><tbody>{filteredStudents.map(student => <tr key={student.id} className="border-b border-slate-50 hover:bg-slate-50"><td className="px-3 py-3.5 font-semibold text-slate-800">{student.full_name}</td><td className="px-3 py-3.5 text-slate-600">{student.student_id}</td><td className="px-3 py-3.5"><Badge tone="teal">{student.programme}</Badge></td><td className="px-3 py-3.5">Semester {student.semester}</td><td className="px-3 py-3.5">{student.academic_session}</td>{isManager && <td className="px-3 py-3.5"><div className="flex gap-2"><button className="text-xs font-semibold text-[#0C16A6]" onClick={() => setStudentModal(student)}>Edit</button><button aria-label={`Padam ${student.full_name}`} className="text-red-600" onClick={() => deleteStudent(student)}><Trash2 size={15}/></button></div></td>}</tr>)}</tbody></table>{filteredStudents.length === 0 && <p className="py-12 text-center text-sm text-slate-500">Tiada rekod pelajar ditemui.</p>}</div><p className="mt-4 text-xs text-slate-400">{filteredStudents.length} rekod dipaparkan</p>
        </section>}

        {tab === 'borrowing' && <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card md:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-lg font-bold">Permohonan Pinjaman Peralatan</h2><p className="mt-1 text-sm text-slate-500">Semak status pinjaman dan ketersediaan stok bengkel.</p></div><Button onClick={() => setBorrowModal(true)} className={primary}><Plus size={16}/> Permohonan baharu</Button></div>
          <div className="relative my-5 max-w-sm"><Search size={16} className="absolute left-3 top-3 text-slate-400"/><input value={query} onChange={e => setQuery(e.target.value)} className={`${inputClass} pl-9`} placeholder="Cari pemohon atau peralatan…"/></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead><tr className="border-b border-slate-100 text-xs uppercase tracking-wide text-slate-400"><th className="px-3 py-3">Pemohon</th><th className="px-3 py-3">Peralatan</th><th className="px-3 py-3">Kuantiti</th><th className="px-3 py-3">Tarikh pinjam / pulang</th><th className="px-3 py-3">Lokasi</th><th className="px-3 py-3">Status</th>{isManager && <th className="px-3 py-3">Keputusan</th>}</tr></thead><tbody>{filteredRequests.map(request => <tr key={request.id} className="border-b border-slate-50"><td className="px-3 py-3"><p className="font-semibold">{request.applicant_name}</p><p className="text-xs text-slate-500">{request.applicant_id} · {request.programme}</p></td><td className="px-3 py-3">{equipmentName(request.equipment_id)}</td><td className="px-3 py-3">{request.quantity}</td><td className="px-3 py-3">{request.borrowing_date}<p className="text-xs text-slate-500">hingga {request.expected_return_date}</p></td><td className="px-3 py-3">{request.workshop_location}</td><td className="px-3 py-3"><Badge tone={statusTone[request.status]}>{statusText[request.status]}</Badge></td>{isManager && <td className="px-3 py-3">{request.status === 'pending' ? <div className="flex gap-2"><button disabled={busy} onClick={() => setRequestStatus(request, 'approved')} className="text-xs font-bold text-emerald-700">Lulus</button><button disabled={busy} onClick={() => setRequestStatus(request, 'rejected')} className="text-xs font-bold text-red-600">Tolak</button></div> : request.status === 'approved' ? <button disabled={busy} onClick={() => setRequestStatus(request, 'returned')} className="text-xs font-semibold text-[#0C16A6]">Tandakan dipulangkan</button> : '—'}</td>}</tr>)}</tbody></table>{filteredRequests.length === 0 && <p className="py-12 text-center text-sm text-slate-500">Tiada permohonan ditemui.</p>}</div>
        </section>}

        {tab === 'resources' && <section className="rounded-2xl border border-slate-100 bg-white p-4 shadow-card md:p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center"><div><h2 className="text-lg font-bold">Bank Nota Pembelajaran</h2><p className="mt-1 text-sm text-slate-500">Bahan pembelajaran mengikut semester dan kursus.</p></div>{isManager && <Button onClick={() => setNoteModal(true)} className={primary}><Upload size={16}/> Muat naik nota</Button>}</div>
          <div className="my-5 grid gap-3 sm:grid-cols-2"><div className="relative"><Search size={16} className="absolute left-3 top-3 text-slate-400"/><input value={query} onChange={e => setQuery(e.target.value)} className={`${inputClass} pl-9`} placeholder="Cari tajuk, topik atau kursus…"/></div><select aria-label="Tapis semester nota" value={semesterFilter} onChange={e => setSemesterFilter(e.target.value)} className={inputClass}><option value="">Semua semester</option>{[1,2,3,4,5,6].map(semester => <option key={semester} value={semester}>Semester {semester}</option>)}</select></div>
          {filteredNotes.length ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{filteredNotes.map(note => <article key={note.id} className="rounded-2xl border border-slate-100 p-5 transition hover:border-[#B5A8C2] hover:shadow-card"><div className="flex items-start justify-between"><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#f2f0f7] text-[#5C5676]"><FileText size={20}/></div><Badge tone="purple">Semester {note.semester}</Badge></div><h3 className="mt-4 font-bold text-slate-900">{note.title}</h3><p className="mt-1 text-sm text-slate-500">{note.course}</p><p className="mt-3 line-clamp-2 text-sm text-slate-600">{note.topic}</p><div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4"><span className="max-w-[65%] truncate text-xs text-slate-400">{note.file_name}</span>{note.file_path && <button onClick={() => downloadNote(note)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0C16A6]"><Download size={15}/> Muat turun</button>}</div></article>)}</div> : <div className="py-16 text-center"><BookOpen className="mx-auto text-slate-300" size={32}/><p className="mt-3 text-sm text-slate-500">Tiada nota dijumpai.</p></div>}
        </section>}
      </div>
    </main>

    {studentModal !== false && <Modal title={editingStudent ? 'Kemaskini rekod pelajar' : 'Tambah pelajar'} onClose={() => setStudentModal(false)}><form onSubmit={saveStudent} className="space-y-4"><Field label="Nama penuh"><input required name="full_name" defaultValue={editingStudent?.full_name} className={inputClass}/></Field><Field label="ID pelajar"><input required name="student_id" defaultValue={editingStudent?.student_id} className={inputClass}/></Field><Field label="E-mel (pilihan)"><input name="email" type="email" defaultValue={editingStudent?.email ?? ''} className={inputClass}/></Field><Field label="Program"><input required name="programme" defaultValue={editingStudent?.programme} placeholder="Diploma Seni Kulinari" className={inputClass}/></Field><div className="grid grid-cols-2 gap-3"><Field label="Semester"><select required name="semester" defaultValue={editingStudent?.semester ?? 1} className={inputClass}>{[1,2,3,4,5,6].map(semester => <option key={semester} value={semester}>{semester}</option>)}</select></Field><Field label="Sesi akademik"><input required name="academic_session" defaultValue={editingStudent?.academic_session} placeholder="2025/2026" className={inputClass}/></Field></div><div className="flex justify-end gap-2 pt-2"><Button type="button" onClick={() => setStudentModal(false)} className="border border-slate-200 text-slate-700">Batal</Button><Button disabled={busy} className={primary}>{busy ? 'Menyimpan…' : 'Simpan rekod'}</Button></div></form></Modal>}
    {borrowModal && <Modal title="Borang permohonan pinjaman" onClose={() => setBorrowModal(false)}><form onSubmit={createBorrowing} className="space-y-4"><div className="grid gap-3 sm:grid-cols-2"><Field label="Nama pemohon"><input required name="applicant_name" defaultValue={demoUser.user_metadata.full_name} className={inputClass}/></Field><Field label="ID pemohon"><input required name="applicant_id" className={inputClass}/></Field><Field label="Program"><input required name="programme" className={inputClass}/></Field><Field label="Peralatan"><select required name="equipment_id" className={inputClass}><option value="">Pilih peralatan</option>{equipment.map(item => <option key={item.id} value={item.id} disabled={item.available_quantity < 1}>{item.name} — stok {item.available_quantity}</option>)}</select></Field><Field label="Kuantiti"><input required name="quantity" type="number" min="1" defaultValue="1" className={inputClass}/></Field><Field label="Lokasi bengkel"><input required name="workshop_location" className={inputClass}/></Field><Field label="Tarikh pinjaman"><input required name="borrowing_date" type="date" min={new Date().toISOString().slice(0,10)} className={inputClass}/></Field><Field label="Tarikh jangka pulang"><input required name="expected_return_date" type="date" min={new Date().toISOString().slice(0,10)} className={inputClass}/></Field></div><Field label="Tujuan pinjaman"><textarea required name="purpose" rows={3} className={inputClass}/></Field><p className="text-xs text-slate-500">Stok disemak semula apabila status permohonan diluluskan.</p><div className="flex justify-end gap-2"><Button type="button" onClick={() => setBorrowModal(false)} className="border border-slate-200 text-slate-700">Batal</Button><Button disabled={busy} className={primary}>{busy ? 'Menghantar…' : 'Hantar permohonan'}</Button></div></form></Modal>}
    {noteModal && <Modal title="Muat naik bahan pembelajaran" onClose={() => setNoteModal(false)}><form onSubmit={uploadNote} className="space-y-4"><Field label="Tajuk"><input required name="title" className={inputClass}/></Field><Field label="Kursus"><input required name="course" placeholder="Food Preparation, Pastry and Bakery…" className={inputClass}/></Field><Field label="Topik / penerangan"><textarea required name="topic" rows={2} className={inputClass}/></Field><div className="grid grid-cols-2 gap-3"><Field label="Semester"><select required name="semester" className={inputClass}>{[1,2,3,4,5,6].map(semester => <option key={semester} value={semester}>{semester}</option>)}</select></Field><Field label="Program (pilihan)"><input name="programme" className={inputClass}/></Field></div><Field label="Fail (PDF, slaid atau bahan lain · maks. 25 MB)"><input required name="file" type="file" accept=".pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png" className={inputClass}/></Field><div className="flex justify-end gap-2"><Button type="button" onClick={() => setNoteModal(false)} className="border border-slate-200 text-slate-700">Batal</Button><Button disabled={busy} className={primary}>{busy ? 'Memuat naik…' : 'Muat naik nota'}</Button></div></form></Modal>}
  </div>
}
