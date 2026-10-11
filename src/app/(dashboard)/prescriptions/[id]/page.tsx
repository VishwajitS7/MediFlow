import { Suspense } from "react";
import { PrescriptionPrintView, PrintSkeleton } from "@/features/prescriptions/prescription-print-view";

export default function PrescriptionPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<PrintSkeleton />}>
      <Prescription params={params} />
    </Suspense>
  );
}

async function Prescription({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PrescriptionPrintView id={id} />;
}
