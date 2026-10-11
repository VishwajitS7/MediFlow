import { Suspense } from "react";
import { PatientDetailView, ProfileSkeleton } from "@/features/patients/patient-detail-view";

export default function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<ProfileSkeleton />}>
      <PatientDetail params={params} />
    </Suspense>
  );
}

async function PatientDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PatientDetailView id={id} />;
}
