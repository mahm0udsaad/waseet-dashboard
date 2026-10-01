import { redirect } from "next/navigation";

// The airport service was split into delivery and inspection, each with its
// own list page.
export default function AirportRequestsPage() {
  redirect("/airport-delivery");
}
