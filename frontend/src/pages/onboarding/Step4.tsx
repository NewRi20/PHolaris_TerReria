import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2, ChevronDown, BookOpen, Monitor, Users, ShieldCheck, TrendingUp } from 'lucide-react'

type TrainingCategory = 'Subject Mastery' | 'Digital Literacy' | 'Soft Skills' | 'Pedagogy' | 'Other'
type TrainingStatus = 'Valid' | 'Expiring Soon' | 'Expired'

interface TrainingEntry {
  id: string
  title: string
  category: TrainingCategory
  completionDate: string
  status: TrainingStatus
}

const CATEGORIES: TrainingCategory[] = [
  'Subject Mastery', 'Digital Literacy', 'Soft Skills', 'Pedagogy', 'Other',
]

const categoryIcons: Record<TrainingCategory, React.ReactNode> = {
  'Subject Mastery': <BookOpen className="w-4 h-4" />,
  'Digital Literacy': <Monitor className="w-4 h-4" />,
  'Soft Skills': <Users className="w-4 h-4" />,
  'Pedagogy': <BookOpen className="w-4 h-4" />,
  'Other': <BookOpen className="w-4 h-4" />,
}

const categoryColors: Record<TrainingCategory, string> = {
  'Subject Mastery': '#115cb9',
  'Digital Literacy': '#1a6b3a',
  'Soft Skills': '#b58c00',
  'Pedagogy': '#001e40',
  'Other': '#44474e',
}

const getTrainingStatus = (dateStr: string): TrainingStatus => {
  if (!dateStr) return 'Valid'
  const date = new Date(dateStr)
  const now = new Date()
  const monthsAgo = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24 * 30)
  if (monthsAgo > 36) return 'Expired'
  if (monthsAgo > 30) return 'Expiring Soon'
  return 'Valid'
}

const statusStyles: Record<TrainingStatus, string> = {
  'Valid': 'text-[#1a6b3a]',
  'Expiring Soon': 'text-[#d95e00]',
  'Expired': 'text-[#ba1a1a]',
}

export default function Step4ProfDevAudit() {
  const navigate = useNavigate()
  const [trainings, setTrainings] = useState<TrainingEntry[]>([
    { id: '1', title: 'Quantum Physics Curriculum Design', category: 'Subject Mastery', completionDate: '2023-12-12', status: 'Valid' },
    { id: '2', title: 'Digital Classroom Transformation', category: 'Digital Literacy', completionDate: '2023-08-05', status: 'Valid' },
    { id: '3', title: 'Conflict Resolution in Labs', category: 'Soft Skills', completionDate: '2023-02-19', status: 'Expiring Soon' },
  ])

  const [newEntry, setNewEntry] = useState({
    title: '',
    category: '' as TrainingCategory | '',
    completionDate: '',
  })

  const handleAddEntry = () => {
    if (!newEntry.title || !newEntry.category || !newEntry.completionDate) return
    const status = getTrainingStatus(newEntry.completionDate)
    const entry: TrainingEntry = {
      id: Date.now().toString(),
      title: newEntry.title,
      category: newEntry.category as TrainingCategory,
      completionDate: newEntry.completionDate,
      status,
    }
    setTrainings([...trainings, entry])
    setNewEntry({ title: '', category: '', completionDate: '' })
  }

  const handleDelete = (id: string) => {
    setTrainings(trainings.filter((t) => t.id !== id))
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return ''
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  }

  return (
    <div className="space-y-6">

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-[0_2px_16px_rgba(0,30,64,0.05)] overflow-hidden">

        {/* Card header */}
        <div className="px-8 pt-8 pb-6 border-b border-[#f3f3f7]">
          <div className="flex items-center gap-2 mb-3">
            <span
              className="text-[0.6rem] font-bold tracking-widest text-[#115cb9] uppercase bg-[#115cb9]/8 px-2.5 py-1 rounded-full"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Step 04 of 04
            </span>
          </div>
          <h1
            className="text-2xl font-bold text-[#001e40]"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Professional Development Audit
          </h1>
          <p className="text-sm text-[#44474e]/70 mt-1" style={{ fontFamily: 'Inter, sans-serif' }}>
            Precision tracking of your professional evolution.
          </p>
        </div>

        {/* New Training Entry Form */}
        <div className="px-8 py-6 space-y-4 border-b border-[#f3f3f7]">
          <p
            className="text-[0.65rem] font-bold tracking-widest text-[#44474e] uppercase"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            New Training Entry
          </p>

          {/* Training Title */}
          <div className="space-y-1.5">
            <label
              className="text-[0.65rem] font-semibold tracking-widest text-[#44474e] uppercase"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Training Title
            </label>
            <input
              type="text"
              placeholder="e.g. Advanced STEM Pedagogy"
              value={newEntry.title}
              onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-[#f9f9fd] text-[#1a1c1e] placeholder:text-[#44474e]/30 text-sm outline-none focus:ring-2 focus:ring-[#115cb9]/25 transition-all"
              style={{ fontFamily: 'Inter, sans-serif' }}
            />
          </div>

          {/* Category + Completion Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                className="text-[0.65rem] font-semibold tracking-widest text-[#44474e] uppercase"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Category
              </label>
              <div className="relative">
                <select
                  value={newEntry.category}
                  onChange={(e) => setNewEntry({ ...newEntry, category: e.target.value as TrainingCategory })}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#f9f9fd] text-[#1a1c1e] text-sm outline-none focus:ring-2 focus:ring-[#115cb9]/25 transition-all appearance-none pr-9"
                  style={{ fontFamily: 'Inter, sans-serif' }}
                >
                  <option value="" disabled>Select Category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#44474e]/40 pointer-events-none" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                className="text-[0.65rem] font-semibold tracking-widest text-[#44474e] uppercase"
                style={{ fontFamily: 'Manrope, sans-serif' }}
              >
                Completion Date
              </label>
              <input
                type="date"
                value={newEntry.completionDate}
                onChange={(e) => setNewEntry({ ...newEntry, completionDate: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#f9f9fd] text-[#1a1c1e] text-sm outline-none focus:ring-2 focus:ring-[#115cb9]/25 transition-all"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>
          </div>

          {/* Add Entry button */}
          <button
            type="button"
            onClick={handleAddEntry}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-[#e1e1e7] text-[#44474e]/60 text-sm font-medium hover:border-[#115cb9]/40 hover:text-[#115cb9] transition-all"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            <Plus className="w-4 h-4" />
            Add Entry
          </button>
        </div>

        {/* Training Repository */}
        <div className="px-8 py-6 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <p
              className="text-[0.65rem] font-bold tracking-widest text-[#44474e] uppercase"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              Training Repository
            </p>
            <span
              className="text-[0.6rem] font-semibold text-[#115cb9] bg-[#115cb9]/10 px-2.5 py-1 rounded-full"
              style={{ fontFamily: 'Manrope, sans-serif' }}
            >
              {trainings.length} {trainings.length === 1 ? 'Entry' : 'Entries'} Recorded
            </span>
          </div>

          {trainings.length === 0 ? (
            <div className="text-center py-8 text-[#44474e]/30 text-sm" style={{ fontFamily: 'Inter, sans-serif' }}>
              No training entries yet. Add your first entry above.
            </div>
          ) : (
            <div className="space-y-2">
              {trainings.map((training) => (
                <div
                  key={training.id}
                  className="flex items-center gap-3 p-3.5 rounded-xl bg-[#f9f9fd] hover:bg-[#f3f3f7] transition-all group"
                >
                  {/* Icon */}
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${categoryColors[training.category]}15`, color: categoryColors[training.category] }}
                  >
                    {categoryIcons[training.category]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold text-[#001e40] truncate"
                      style={{ fontFamily: 'Manrope, sans-serif' }}
                    >
                      {training.title}
                    </p>
                    <p
                      className="text-xs text-[#44474e]/50 mt-0.5"
                      style={{ fontFamily: 'Inter, sans-serif' }}
                    >
                      {training.category} · {formatDate(training.completionDate)}
                    </p>
                  </div>

                  {/* Status + Delete */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="text-right">
                      <p
                        className={`text-xs font-semibold ${statusStyles[training.status]}`}
                        style={{ fontFamily: 'Manrope, sans-serif' }}
                      >
                        {training.status}
                      </p>
                      <p className="text-[0.6rem] text-[#44474e]/30 uppercase tracking-wide" style={{ fontFamily: 'Inter, sans-serif' }}>
                        Status
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(training.id)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-[#44474e]/20 hover:text-[#ba1a1a] hover:bg-[#ba1a1a]/10 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-8 py-5 bg-[#f9f9fd] flex items-center justify-between">
          <button
            onClick={() => navigate('/onboarding/3')}
            className="flex items-center gap-1.5 text-sm text-[#44474e]/60 hover:text-[#001e40] transition-colors"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 14 14">
              <path d="M11 7H3M6 4L3 7l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>

          <button
            onClick={() => console.log('Complete onboarding')}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#001e40] to-[#1a3a5c] text-white text-sm font-semibold hover:shadow-[0_4px_20px_rgba(0,30,64,0.25)] active:scale-[0.99] transition-all"
            style={{ fontFamily: 'Manrope, sans-serif' }}
          >
            Complete Onboarding
            <svg className="w-4 h-4" fill="none" viewBox="0 0 16 16">
              <path d="M2 8l4 4 8-8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_16px_rgba(0,30,64,0.05)] flex gap-4">
          <div className="w-9 h-9 rounded-xl bg-[#115cb9]/10 flex items-center justify-center flex-shrink-0">
            <ShieldCheck className="w-4 h-4 text-[#115cb9]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#001e40]" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Data Privacy Guard
            </p>
            <p className="text-xs text-[#44474e]/60 mt-1 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
              PHolaris encrypts all professional credentials in accordance with DOST security protocols.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_16px_rgba(0,30,64,0.05)] flex gap-4">
          <div className="w-9 h-9 rounded-xl bg-[#1a6b3a]/10 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-4 h-4 text-[#1a6b3a]" />
          </div>
          <div>
            <p className="text-sm font-semibold text-[#001e40]" style={{ fontFamily: 'Manrope, sans-serif' }}>
              Professional Growth
            </p>
            <p className="text-xs text-[#44474e]/60 mt-1 leading-relaxed" style={{ fontFamily: 'Inter, sans-serif' }}>
              Completing your profile unlocks specialized grants and equipment access for your specific academic field.
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}