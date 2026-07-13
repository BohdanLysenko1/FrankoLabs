/** Contact form request types, shared by the public form and the intake server action. */

export const CONTACT_EMAIL = "lysenkob337@gmail.com"; // TODO: switch to hello@frankolabs.com when the domain is live

export const requestTypes = [
  { value: "consultation", label: "Book a consultation" },
  { value: "audit", label: "Request a website audit" },
  { value: "waas", label: "Website as a Service" },
  { value: "custom", label: "Custom project" },
  { value: "waitlist", label: "Franko OS waitlist" },
] as const;

export type RequestTypeValue = (typeof requestTypes)[number]["value"];

export function requestTypeLabel(value: string): string {
  return requestTypes.find((t) => t.value === value)?.label ?? "Inquiry";
}
