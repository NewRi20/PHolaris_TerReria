import { useEffect, useState } from 'react';
import TeacherMap, { type MapEventData } from './ui/TeacherMap';
import { api } from '../services/api';

interface QueueItem {
  id: string;
  rank: string | number;
  name: string;
  region: string;
  detail: string;
  isCritical: boolean;
  score: number;
  icon: string;
}

interface MyActivityItem {
  id: string;
  title: string;
  region: string;
  date: string;
  time: string;
  type: 'REGISTERED' | 'REQUESTED';
  eventId?: string;
  source?: 'training' | 'map' | 'local';
}

interface RecommendationItem {
  id: string;
  timeframe: 'IMMEDIATE' | 'MID_TERM' | 'LONG_TERM';
  timeLabel: string;
  region: string;
  trainingNeeded: string;
  description: string;
  isInterested: boolean;
}

interface TeacherProfilePayload {
  profile: {
    region?: string | null;
    current_subject?: string | null;
    full_name?: string | null;
  };
  trainings: Array<{
    id: string;
    training_name: string;
    date_attended?: string | null;
    created_at: string;
    provider?: string | null;
    subject_area?: string | null;
    duration_days?: number | null;
  }>;
}

interface RegionMetricRow {
  region: string;
  teacher_count: number;
  color_code: string;
  metrics_flagged_count: number;
  upcoming_events_count: number;
  total_interested: number;
  readiness_score: number | null;
}

interface RegionEventGroup {
  region: string;
  events: Array<{
    event_id: string;
    title: string;
    status: string;
    event_date: string | null;
    interested_count: number;
  }>;
}

interface DashboardEventData extends MapEventData {
  regionName?: string;
  rawName?: string;
  latlng?: { lat: number; lng: number };
}

type StoredActivity = Partial<MyActivityItem> & {
  id: string;
  title: string;
  region: string;
  date: string;
  time: string;
  type: 'REGISTERED' | 'REQUESTED';
};

const LOCAL_ACTIVITY_KEY = 'pholaris_teacher_dashboard_local_activities';
const LOCAL_INTEREST_KEY = 'pholaris_teacher_dashboard_interest';

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function formatDate(value?: string | null) {
  if (!value) return 'Pending Schedule';

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

function getReadinessPercent(row: RegionMetricRow) {
  const raw = typeof row.readiness_score === 'number' ? row.readiness_score : 0;
  return raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
}

function getColorWeight(colorCode: string) {
  switch (colorCode) {
    case 'red':
      return 0;
    case 'orange':
      return 1;
    case 'yellow':
      return 2;
    default:
      return 3;
  }
}

function getActivityKey(activity: MyActivityItem) {
  return activity.eventId ? `event:${activity.eventId}` : `activity:${activity.id}`;
}

function mergeActivities(...groups: Array<MyActivityItem[]>) {
  const map = new Map<string, MyActivityItem>();

  for (const group of groups) {
    for (const activity of group) {
      map.set(getActivityKey(activity), activity);
    }
  }

  return Array.from(map.values());
}

function loadStoredActivities() {
  if (typeof window === 'undefined') return [] as MyActivityItem[];

  const stored = safeParse<StoredActivity[]>(
    localStorage.getItem(LOCAL_ACTIVITY_KEY),
    [],
  );

  return stored.map((activity) => ({
    ...activity,
    source: activity.source ?? 'local',
  }));
}

function saveStoredActivities(activities: MyActivityItem[]) {
  if (typeof window === 'undefined') return;

  const localActivities = activities.filter((activity) => activity.source !== 'training');
  localStorage.setItem(LOCAL_ACTIVITY_KEY, JSON.stringify(localActivities));
}

function loadStoredInterests() {
  if (typeof window === 'undefined') return {} as Record<string, boolean>;
  return safeParse<Record<string, boolean>>(localStorage.getItem(LOCAL_INTEREST_KEY), {});
}

function saveStoredInterests(map: Record<string, boolean>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_INTEREST_KEY, JSON.stringify(map));
}

function buildQueueData(rows: RegionMetricRow[]) {
  return [...rows]
    .sort((left, right) => {
      const leftWeight = getColorWeight(left.color_code);
      const rightWeight = getColorWeight(right.color_code);

      if (leftWeight !== rightWeight) {
        return leftWeight - rightWeight;
      }

      return getReadinessPercent(left) - getReadinessPercent(right);
    })
    .map((row, index) => {
      const readiness = getReadinessPercent(row);
      const isCritical = row.color_code === 'red' || row.color_code === 'orange';

      return {
        id: `queue_${slugify(row.region)}`,
        rank: index + 1,
        name: row.region,
        region: row.region,
        detail: `Readiness ${readiness}% • ${row.metrics_flagged_count} flags`,
        isCritical,
        score: Math.max(0, 100 - readiness) + row.metrics_flagged_count * 4 + row.upcoming_events_count * 2,
        icon: isCritical ? 'priority_high' : 'trending_up',
      } satisfies QueueItem;
    });
}

function buildMapEvents(groups: RegionEventGroup[]) {
  return groups.flatMap((group) =>
    group.events.map((event) => ({
      eventId: event.event_id,
      region: group.region,
      title: event.title,
      topic: event.status === 'scheduled' ? 'Scheduled Session' : 'Upcoming Training',
      date: formatDate(event.event_date),
      status: event.status === 'approved' || event.status === 'scheduled' ? 'active' : 'historical',
    } satisfies MapEventData)),
  );
}

function buildTrainingActivities(profile: TeacherProfilePayload['profile'], trainings: TeacherProfilePayload['trainings']) {
  return trainings.map((training) => ({
    id: `training_${training.id}`,
    title: training.training_name,
    region: profile.region ?? training.provider ?? 'Teacher Profile',
    date: formatDate(training.date_attended ?? training.created_at),
    time: training.duration_days ? `${training.duration_days} day(s)` : '--',
    type: 'REGISTERED' as const,
    source: 'training' as const,
  }));
}

function buildRecommendations(
  profile: TeacherProfilePayload['profile'],
  regions: RegionMetricRow[],
  interestMap: Record<string, boolean>,
) {
  const sorted = [...regions].sort((left, right) => {
    const leftWeight = getColorWeight(left.color_code);
    const rightWeight = getColorWeight(right.color_code);

    if (leftWeight !== rightWeight) {
      return leftWeight - rightWeight;
    }

    return getReadinessPercent(left) - getReadinessPercent(right);
  });

  const subject = profile.current_subject?.trim() || 'your teaching specialty';
  const teacherRegion = profile.region?.trim();
  const recommendations: RecommendationItem[] = [];

  for (const row of sorted.filter((entry) => entry.color_code === 'red' || entry.color_code === 'orange').slice(0, 2)) {
    const id = `rec_${slugify(row.region)}`;
    recommendations.push({
      id,
      timeframe: row.color_code === 'red' ? 'IMMEDIATE' : 'MID_TERM',
      timeLabel: row.color_code === 'red' ? 'Immediate Support' : 'Priority Follow-up',
      region: row.region,
      trainingNeeded: `${subject} support for ${row.region}`,
      description: `Readiness is ${getReadinessPercent(row)}% with ${row.metrics_flagged_count} flagged indicators and ${row.upcoming_events_count} upcoming events.`,
      isInterested: Boolean(interestMap[id]),
    });
  }

  if (teacherRegion && recommendations.length < 3) {
    const id = `rec_${slugify(teacherRegion)}_growth`;
    recommendations.push({
      id,
      timeframe: 'LONG_TERM',
      timeLabel: 'Growth Path',
      region: teacherRegion,
      trainingNeeded: 'Teacher Leadership Development',
      description: `Build a longer-term leadership path for ${teacherRegion} while extending support into the regions with the highest readiness gaps.`,
      isInterested: Boolean(interestMap[id]),
    });
  }

  while (recommendations.length < 3 && sorted.length > 0) {
    const row = sorted[recommendations.length % sorted.length];
    const id = `rec_${slugify(row.region)}_growth`;

    if (recommendations.some((item) => item.id === id)) {
      break;
    }

    recommendations.push({
      id,
      timeframe: 'LONG_TERM',
      timeLabel: 'Sustained Support',
      region: row.region,
      trainingNeeded: `${subject} Leadership`,
      description: `Expand long-term support for ${row.region} as part of a wider regional improvement plan.`,
      isInterested: Boolean(interestMap[id]),
    });
  }

  return recommendations.slice(0, 3);
}

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState({ visible: false, title: '', msg: '', type: 'info' as 'success' | 'error' | 'info' });
  const [upliftQueue, setUpliftQueue] = useState<QueueItem[]>([]);
  const [fullReportData, setFullReportData] = useState<QueueItem[]>([]);
  const [myActivities, setMyActivities] = useState<MyActivityItem[]>([]);
  const [mapEvents, setMapEvents] = useState<MapEventData[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const showToast = (title: string, msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ visible: true, title, msg, type });
    setTimeout(() => setToast((previous) => ({ ...previous, visible: false })), 4000);
  };

  useEffect(() => {
    let cancelled = false;

    async function fetchTeacherDashboard() {
      setLoading(true);

      try {
        const [teacherResult, mapMetricsResult, groupedEventsResult] = await Promise.allSettled([
          api.getMyTeacherProfile() as Promise<TeacherProfilePayload>,
          api.getMapRegions() as Promise<RegionMetricRow[]>,
          api.getMapEventsByRegion() as Promise<RegionEventGroup[]>,
        ]);

        if (cancelled) return;

        const teacherResponse = teacherResult.status === 'fulfilled'
          ? teacherResult.value
          : { profile: {}, trainings: [] } satisfies TeacherProfilePayload;

        const mapMetrics = mapMetricsResult.status === 'fulfilled' ? mapMetricsResult.value : [];
        const groupedEvents = groupedEventsResult.status === 'fulfilled' ? groupedEventsResult.value : [];

        const queueData = buildQueueData(mapMetrics);
        const localActivities = loadStoredActivities();
        const trainingActivities = buildTrainingActivities(teacherResponse.profile, teacherResponse.trainings);
        const interestMap = loadStoredInterests();
        const dashboardRecommendations = buildRecommendations(teacherResponse.profile, mapMetrics, interestMap);

        setUpliftQueue(queueData.slice(0, 5));
        setFullReportData(queueData);
        setMapEvents(buildMapEvents(groupedEvents));
        setMyActivities(mergeActivities(localActivities, trainingActivities));
        setRecommendations(dashboardRecommendations);
        const rejectedCount = [teacherResult, mapMetricsResult, groupedEventsResult].filter((result) => result.status === 'rejected').length;
        if (rejectedCount > 0) {
          showToast('Partial Sync', 'Some dashboard sources were unavailable. Showing cached and local data where possible.', 'info');
        }
      } catch (error) {
        console.error('Dashboard fetch error:', error);
        showToast('Sync Error', 'Could not load the latest dashboard data from the server.', 'error');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchTeacherDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  const persistActivities = (nextActivities: MyActivityItem[]) => {
    setMyActivities(nextActivities);
    saveStoredActivities(nextActivities);
  };

  const persistInterests = (nextRecommendations: RecommendationItem[]) => {
    setRecommendations(nextRecommendations);
    const nextInterestMap = nextRecommendations.reduce<Record<string, boolean>>((accumulator, recommendation) => {
      accumulator[recommendation.id] = recommendation.isInterested;
      return accumulator;
    }, {});
    saveStoredInterests(nextInterestMap);
  };

  const handleMapAction = async (actionType: 'register' | 'request', eventData: DashboardEventData) => {
    showToast('Processing', 'Syncing your action with the server...', 'info');

    const activityId = eventData.eventId ? `event_${eventData.eventId}` : `activity_${Date.now()}`;
    const nextActivity: MyActivityItem = {
      id: activityId,
      eventId: eventData.eventId,
      title: eventData.title,
      region: eventData.regionName ?? eventData.region,
      date: eventData.date && eventData.date !== 'TBA' ? eventData.date : 'Pending Schedule',
      time: actionType === 'register' ? '08:00 AM - 05:00 PM' : '--',
      type: actionType === 'register' ? 'REGISTERED' : 'REQUESTED',
      source: actionType === 'register' ? 'map' : 'local',
    };

    try {
      if (actionType === 'register' && eventData.eventId) {
        await api.rsvpEvent(eventData.eventId, true);
      }

      persistActivities(mergeActivities([nextActivity], myActivities));

      if (actionType === 'register') {
        showToast('Success!', `You are now officially registered for ${eventData.title}.`, 'success');
      } else {
        showToast('Request Sent', `Your training request for ${eventData.regionName ?? eventData.region} has been saved locally.`, 'success');
      }
    } catch (error) {
      console.error(error);
      persistActivities(mergeActivities([nextActivity], myActivities));
      showToast('Saved Locally', 'The action could not be synced, but it is visible on your dashboard.', 'info');
    }
  };

  const handleToggleInterest = (rec: RecommendationItem) => {
    const nextInterested = !rec.isInterested;
    const nextRecommendations = recommendations.map((recommendation) =>
      recommendation.id === rec.id ? { ...recommendation, isInterested: nextInterested } : recommendation,
    );

    persistInterests(nextRecommendations);

    if (nextInterested) {
      const requestedActivity: MyActivityItem = {
        id: rec.id,
        title: rec.trainingNeeded,
        region: rec.region,
        date: 'Pending Schedule',
        time: '--',
        type: 'REQUESTED',
        source: 'local',
      };

      persistActivities(mergeActivities([requestedActivity], myActivities));
      showToast('Interest Registered', 'Event added to your requested activities.', 'success');
    } else {
      persistActivities(myActivities.filter((activity) => activity.id !== rec.id));
      showToast('Interest Withdrawn', 'Event removed from your requested activities.', 'info');
    }
  };

  const handleCancelActivity = async (id: string, title: string) => {
    const activity = myActivities.find((item) => item.id === id);

    if (!activity) return;

    if (activity.source === 'training') {
      showToast('Read Only', 'Training history is synced from your profile and cannot be removed.', 'info');
      return;
    }

    try {
      if (activity.eventId && activity.type === 'REGISTERED') {
        await api.rsvpEvent(activity.eventId, false);
      }

      persistActivities(myActivities.filter((item) => item.id !== id));

      if (id.startsWith('rec_')) {
        const nextRecommendations = recommendations.map((recommendation) =>
          recommendation.id === id ? { ...recommendation, isInterested: false } : recommendation,
        );
        persistInterests(nextRecommendations);
      }

      showToast('Activity Cancelled', `You have been removed from "${title}".`, 'info');
    } catch (error) {
      console.error(error);
      showToast('Error', 'Could not cancel your activity.', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen flex-col items-center justify-center text-primary bg-slate-50/50">
        <span className="material-symbols-outlined text-4xl mb-4 animate-spin">refresh</span>
        <div className="font-bold tracking-widest uppercase text-sm">Loading Your Dashboard...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-8 p-8 relative">
      <div className="flex flex-col gap-2 shrink-0">
        <h1 className="text-3xl font-extrabold text-primary tracking-tight font-headline">Regional Insights & Training</h1>
        <p className="text-slate-500 text-sm max-w-3xl leading-relaxed">
          Explore the interactive map below to discover upcoming professional development events, view teacher density, and formally request training for critical or historically underserved regions.
        </p>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 xl:col-span-9 w-full">
          <div className="w-full h-[600px] bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-800 z-0">
            <TeacherMap data={mapEvents} onEventAction={handleMapAction} />
          </div>
        </div>

        <div className="lg:col-span-4 xl:col-span-3 flex flex-col bg-white rounded-3xl p-6 shadow-sm border border-slate-200 overflow-hidden h-[600px]">
          <div className="flex items-center justify-between mb-2 shrink-0">
            <h3 className="text-lg font-bold text-primary flex items-center gap-2 font-headline">
              <span className="material-symbols-outlined text-error">priority_high</span>
              Uplift Priority Queue
            </h3>
          </div>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mb-6 border-b border-slate-100 pb-3">
            Top 5 Critical Regions
          </p>

          <div className="flex-1 overflow-y-auto space-y-3 pr-1 no-scrollbar">
            {upliftQueue.length > 0 ? (
              upliftQueue.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl flex items-center justify-between group transition-all border ${
                    item.isCritical ? 'bg-error/5 border-error/20' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <span className={`text-xl font-black italic ${item.isCritical ? 'text-error/60' : 'text-slate-300'}`}>
                      {Number(item.rank) < 10 ? `0${item.rank}` : item.rank}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-primary">{item.name}</p>
                      <p className={`text-[9px] font-bold uppercase tracking-widest mt-0.5 ${item.isCritical ? 'text-error' : 'text-slate-500'}`}>
                        {item.detail}
                      </p>
                    </div>
                  </div>
                  <span className={`material-symbols-outlined text-sm ${item.isCritical ? 'text-error' : 'text-slate-400'}`}>
                    {item.icon}
                  </span>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 h-full text-slate-400 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50">
                <span className="material-symbols-outlined text-3xl mb-2">format_list_numbered</span>
                <span className="text-xs font-bold text-center">Awaiting regional<br />analysis data...</span>
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 shrink-0">
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="w-full bg-slate-50 border border-slate-200 text-primary text-xs font-bold py-3 rounded-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">format_list_bulleted</span>
              View Full Analysis Report
            </button>
          </div>
        </div>
      </section>

      <section className="mt-4 border-t border-slate-200 pt-10">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-secondary text-3xl">auto_awesome</span>
          <div>
            <h2 className="text-2xl font-headline font-black text-primary tracking-tight">Analytics-Driven Action Timeline</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Live map metrics and your profile are combined to prioritize where to deploy training and what specific topics are needed.</p>
          </div>
        </div>

        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {recommendations.map((rec) => {
              const isImmediate = rec.timeframe === 'IMMEDIATE';
              const isMid = rec.timeframe === 'MID_TERM';
              const accentColor = isImmediate ? 'bg-error' : isMid ? 'bg-amber-500' : 'bg-primary';
              const lightColor = isImmediate ? 'bg-error/10 text-error' : isMid ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary';

              return (
                <div key={rec.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden flex flex-col">
                  <div className={`absolute top-0 left-0 w-full h-1.5 ${accentColor}`}></div>

                  <div className="flex justify-between items-start mb-4 mt-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${lightColor}`}>
                      {rec.timeLabel}
                    </span>
                    <span className={`material-symbols-outlined ${isImmediate ? 'text-error' : isMid ? 'text-amber-500' : 'text-primary'}`}>
                      {isImmediate ? 'emergency' : isMid ? 'calendar_month' : 'update'}
                    </span>
                  </div>

                  <div className="mb-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">pin_drop</span> {rec.region}
                    </p>
                    <h4 className="text-lg font-headline font-extrabold text-primary leading-tight">{rec.trainingNeeded}</h4>
                  </div>

                  <p className="text-sm text-slate-600 leading-relaxed mb-6 flex-1">{rec.description}</p>

                  <div className="mt-auto pt-4 border-t border-slate-100">
                    <button
                      onClick={() => handleToggleInterest(rec)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border ${
                        rec.isInterested
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-primary hover:text-primary'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        {rec.isInterested ? 'task_alt' : 'front_hand'}
                      </span>
                      {rec.isInterested ? 'Interest Registered' : 'I am Interested'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-3 animate-pulse">model_training</span>
            <p className="text-sm font-bold text-slate-600">Analyzing Regional Data...</p>
            <p className="text-xs mt-1">Live map metrics are being compiled to generate new action timelines.</p>
          </div>
        )}
      </section>

      <section className="mt-4 border-t border-slate-200 pt-10">
        <div className="flex items-center gap-3 mb-6">
          <span className="material-symbols-outlined text-primary text-3xl">local_activity</span>
          <div>
            <h2 className="text-2xl font-headline font-black text-primary tracking-tight">My Registered & Requested Events</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Track the trainings from your profile plus the events and requests you have saved from the map and recommendations.</p>
          </div>
        </div>

        {myActivities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myActivities.map((activity) => {
              const isReadOnlyTraining = activity.source === 'training';

              return (
                <div key={activity.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col h-full group">
                  <div className={`absolute top-0 right-0 text-white text-[9px] font-bold px-3 py-1 rounded-bl-lg tracking-widest ${
                    activity.type === 'REGISTERED' ? 'bg-emerald-500' : 'bg-blue-500'
                  }`}>
                    {activity.type}
                  </div>

                  <div className="flex items-start gap-3 mb-6 mt-2">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                      activity.type === 'REGISTERED' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      <span className="material-symbols-outlined text-xl">
                        {activity.type === 'REGISTERED' ? 'how_to_reg' : 'campaign'}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-headline font-bold text-primary leading-tight pr-6">{activity.title}</h4>
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">location_on</span> {activity.region}
                      </p>
                    </div>
                  </div>

                  <div className="mt-auto bg-slate-50 border border-slate-100 rounded-xl p-3 mb-4 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">calendar_month</span> Date
                      </span>
                      <span className="font-semibold text-slate-700">{activity.date}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400 font-bold uppercase tracking-widest text-[9px] flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">schedule</span> Time
                      </span>
                      <span className="font-semibold text-slate-700">{activity.time}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => (isReadOnlyTraining ? showToast('Read Only', 'Training history is synced from your profile and cannot be removed.', 'info') : handleCancelActivity(activity.id, activity.title))}
                    className="w-full py-2 rounded-lg border border-slate-200 text-slate-500 text-xs font-bold hover:bg-error/5 hover:text-error hover:border-error/30 transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                    {isReadOnlyTraining
                      ? 'Training Record'
                      : activity.type === 'REGISTERED'
                        ? 'Cancel Registration'
                        : 'Withdraw Request'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center text-slate-400">
            <span className="material-symbols-outlined text-4xl mb-3">event_note</span>
            <p className="text-sm font-bold text-slate-600">No Active Registrations</p>
            <p className="text-xs mt-1">Register for an event via the map or mark interest in a recommendation.</p>
          </div>
        )}
      </section>

      {isReportModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center shrink-0">
              <div>
                <h3 className="font-headline font-extrabold text-xl text-primary">Full Geographic Analysis Report</h3>
                <p className="text-xs text-slate-500 mt-1">Complete ranking of all divisions combining map readiness and teacher workload signals.</p>
              </div>
              <button onClick={() => setIsReportModalOpen(false)} className="text-slate-400 hover:text-slate-700 transition-colors bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-50/50 flex-1">
              {fullReportData.length > 0 ? (
                <div className="space-y-3">
                  {fullReportData.map((item) => (
                    <div key={item.id} className={`flex items-center gap-5 p-4 rounded-xl border bg-white shadow-sm transition-all hover:shadow-md ${item.isCritical ? 'border-error/30 border-l-4 border-l-error' : 'border-slate-200'}`}>
                      <div className={`text-2xl font-black italic w-8 text-center ${item.isCritical ? 'text-error' : 'text-slate-300'}`}>
                        {Number(item.rank) < 10 ? `0${item.rank}` : item.rank}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base font-bold text-slate-900">{item.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">map</span> {item.region}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${item.isCritical ? 'bg-error/10 text-error' : 'bg-slate-100 text-slate-500'}`}>
                          {item.detail}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                          Risk: <span className={item.isCritical ? 'text-error' : 'text-primary'}>{item.score}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                  <span className="material-symbols-outlined text-3xl mb-2">format_list_numbered</span>
                  <span className="text-xs font-bold text-center">Awaiting regional<br />analysis data...</span>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-white flex justify-end shrink-0">
              <button onClick={() => setIsReportModalOpen(false)} className="px-6 py-2.5 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-md">
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`fixed bottom-8 right-8 z-[200] transition-all duration-500 ease-out ${toast.visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95 pointer-events-none'}`}>
        <div className="bg-slate-900 text-white px-6 py-5 rounded-2xl shadow-2xl flex items-center gap-4 border border-slate-700">
          <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
            {toast.type === 'success' ? (
              <span className="material-symbols-outlined text-green-400">check_circle</span>
            ) : toast.type === 'error' ? (
              <span className="material-symbols-outlined text-red-400">warning</span>
            ) : (
              <span className="material-symbols-outlined text-blue-400">info</span>
            )}
          </div>
          <div>
            <p className="text-sm font-bold tracking-wide">{toast.title}</p>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xs">{toast.msg}</p>
          </div>
        </div>
      </div>
    </div>
  );
}