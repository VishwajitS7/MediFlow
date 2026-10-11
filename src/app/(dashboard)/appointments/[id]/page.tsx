import { Suspense } from "react";
import { AppointmentDetailView, DetailSkeleton } from "@/features/appointments/appointment-detail-view";

export default function AppointmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <AppointmentDetail params={params} />
    </Suspense>
  );
}

async function AppointmentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <AppointmentDetailView id={id} />;
}
