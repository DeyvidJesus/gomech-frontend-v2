import { createFileRoute } from '@tanstack/react-router';
import { VehicleHistoryPortal } from '@/features/operations/components/VehicleHistoryPortal';

export const Route = createFileRoute('/portal/vehicles/$id/history')({
  component: VehicleHistoryPortalPage,
});

function VehicleHistoryPortalPage() {
  const { id } = Route.useParams();

  return <VehicleHistoryPortal vehicleId={id} />;
}
