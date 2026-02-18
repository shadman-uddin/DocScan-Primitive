export const headerFields = [
  { name: "foreman_name", label: "Foreman Name", type: "text", required: true },
  { name: "date", label: "Date", type: "date", required: true },
];

export const rowFields = [
  { name: "worker_name", label: "Worker Name", type: "text", required: true },
  { name: "worker_id", label: "Worker ID#", type: "text", required: true },
  { name: "time_in", label: "Time In (AM)", type: "text", required: true },
  { name: "time_out", label: "Time Out (PM)", type: "text", required: false },
];

export const fieldDefinitions = [...headerFields, ...rowFields];

export type FieldDefinition = (typeof fieldDefinitions)[number];
export type HeaderField = (typeof headerFields)[number];
export type RowField = (typeof rowFields)[number];
