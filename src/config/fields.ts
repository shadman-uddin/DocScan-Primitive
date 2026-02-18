export const fieldDefinitions = [
  { name: "worker_name", label: "Name", type: "text", required: true },
  { name: "worker_id", label: "ID", type: "text", required: true },
  { name: "foreman", label: "Foreman", type: "text", required: true },
  { name: "entry_date", label: "Date", type: "date", required: true },
];

export type FieldDefinition = (typeof fieldDefinitions)[number];
