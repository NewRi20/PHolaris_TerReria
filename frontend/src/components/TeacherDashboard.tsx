import TeacherMap from './ui/TeacherMap';

export default function TeacherDashboard() {
  return (
    <div className="p-8 flex-1 overflow-hidden flex flex-col gap-8">
      <section className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        <div className="lg:col-span-9 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-extrabold text-primary tracking-tight">Regional Insights & Training</h1>
          </div>
          <div className="relative flex-1 bg-slate-900 rounded-3xl overflow-hidden shadow-2xl">
            <TeacherMap />
          </div>
        </div>
      </section>
    </div>
  );
}