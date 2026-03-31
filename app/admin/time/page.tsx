import { AdminPageShell } from "@/components/admin-page-shell";
import { AdminTimeCorrectionsWorkspace } from "@/components/admin-time-corrections-workspace";
import { requireProfile } from "@/lib/auth";
import { getAdminTimeData, getAuditLogsForDay, getSegmentsForDay } from "@/lib/data/time";

type AdminTimePageProps = {
  searchParams?: Promise<{
    worker?: string;
    date?: string;
    day?: string;
    segment?: string;
    request?: string;
  }>;
};

export default async function AdminTimePage({ searchParams }: AdminTimePageProps) {
  await requireProfile("admin");
  const params = (await searchParams) ?? {};
  const { days, workers, correctionRequests } = await getAdminTimeData({
    workerId: params.worker,
    date: params.date
  });

  const selectedDay =
    params.worker && params.date
      ? days.find((day) => day.id === params.day) ?? days[0] ?? null
      : null;
  const segments = selectedDay ? await getSegmentsForDay(selectedDay.id) : [];
  const audits = selectedDay ? await getAuditLogsForDay(selectedDay.id) : [];

  return (
    <AdminPageShell title="Time" subtitle="Review, correct, and approve worker time for a single day">
      <AdminTimeCorrectionsWorkspace
        audits={audits}
        correctionRequests={correctionRequests}
        initialDate={params.date}
        initialRequestId={params.request}
        initialSegmentId={params.segment}
        initialWorkerId={params.worker}
        segments={segments}
        selectedDay={selectedDay}
        workers={workers}
      />
    </AdminPageShell>
  );
}
