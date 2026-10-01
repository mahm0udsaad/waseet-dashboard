import { AirportRequestsList } from "@/components/admin/airport-requests/AirportRequestsList";

type Props = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    status?: string;
  }>;
};

export default function AirportInspectionRequestsPage({ searchParams }: Props) {
  return <AirportRequestsList serviceType="inspection" searchParams={searchParams} />;
}
