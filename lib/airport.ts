export type AirportServiceType = "delivery" | "inspection";

// `delivery_inspection` only exists on legacy rows created before the split.
export const AIRPORT_SERVICE_LABELS: Record<string, string> = {
  delivery: "توصيل للمطار",
  inspection: "تفتيش",
  delivery_inspection: "تفتيش وتوصيل (قديم)",
};

export const AIRPORT_SERVICE_PAGES: Record<
  AirportServiceType,
  { href: string; title: string; subtitle: string }
> = {
  delivery: {
    href: "/airport-delivery",
    title: "طلبات التوصيل للمطار",
    subtitle: "طلبات توصيل العاملات إلى المطار.",
  },
  inspection: {
    href: "/airport-inspection",
    title: "طلبات التفتيش",
    subtitle: "طلبات تفتيش العاملات وأمتعتهن قبل السفر.",
  },
};

export function getAirportServiceLabel(serviceType: string | null | undefined) {
  return AIRPORT_SERVICE_LABELS[serviceType ?? ""] ?? AIRPORT_SERVICE_LABELS.delivery_inspection;
}

// Legacy combined requests cover both services, so they show in both lists.
export function airportServiceTypeFilter(serviceType: AirportServiceType) {
  return [serviceType, "delivery_inspection"];
}

export function airportServicePageFor(serviceType: string | null | undefined) {
  return serviceType === "inspection"
    ? AIRPORT_SERVICE_PAGES.inspection
    : AIRPORT_SERVICE_PAGES.delivery;
}

// Customer-facing name, used in receipts, chat messages and notifications.
const AIRPORT_SERVICE_NAMES: Record<string, string> = {
  delivery: "خدمة التوصيل للمطار",
  inspection: "خدمة التفتيش في المطار",
  delivery_inspection: "خدمة تفتيش وتوصيل المطار",
};

export function getAirportServiceName(serviceType: string | null | undefined) {
  return AIRPORT_SERVICE_NAMES[serviceType ?? ""] ?? AIRPORT_SERVICE_NAMES.delivery_inspection;
}
