export type FieldKind =
  | "text"
  | "email"
  | "tel"
  | "textarea"
  | "select"
  | "money"
  | "decimal"
  | "integer"
  | "datetime"
  | "reference"
  | "locations";
export type FieldConfig = {
  key: string;
  label: string;
  kind: FieldKind;
  required?: boolean;
  max?: number;
  options?: string[];
  reference?: "clients" | "properties" | "requirements";
  hint?: string;
};
export type ColumnConfig = {
  key: string;
  label: string;
  kind?: "money" | "date" | "datetime" | "status" | "reference" | "land";
  reference?: "clients" | "properties" | "requirements";
};
export type ResourceConfig = {
  key: string;
  endpoint: string;
  listEndpoint?: string;
  title: string;
  singular: string;
  description: string;
  eyebrow: string;
  columns: ColumnConfig[];
  fields: FieldConfig[];
  statuses?: string[];
  searchable?: boolean;
  deleteAction?: "delete" | "archive" | "permanent-delete";
  allowCreate?: boolean;
  fixedFilter?: Record<string, string>;
};

const propertyTypes = ["HOUSE", "APARTMENT", "LAND", "COMMERCIAL", "OTHER"];
const transactionTypes = ["SALE", "RENT"];
const landUnits = [
  "ROPANI",
  "AANA",
  "PAISA",
  "DAAM",
  "BIGHA",
  "KATTHA",
  "DHUR",
  "SQ_FT",
  "SQ_M",
];
export const provinceNamesByNumber: Record<string, string> = {
  "1": "Koshi",
  "2": "Madhesh",
  "3": "Bagmati",
  "4": "Gandaki",
  "5": "Lumbini",
  "6": "Karnali",
  "7": "Sudurpashchim",
};
export const provinceNumber = (value: string) =>
  value.match(/^(?:Province\s*)?([1-7])$/i)?.[1] ??
  Object.keys(provinceNamesByNumber).find(
    (number) =>
      provinceNamesByNumber[number].toLowerCase() === value.toLowerCase(),
  );
const provinces = Object.values(provinceNamesByNumber);
const facings = [
  "NORTH",
  "NORTH_EAST",
  "EAST",
  "SOUTH_EAST",
  "SOUTH",
  "SOUTH_WEST",
  "WEST",
  "NORTH_WEST",
];
const ref = (
  key: string,
  label: string,
  reference: FieldConfig["reference"],
  required = false,
): FieldConfig => ({ key, label, kind: "reference", reference, required });
const text = (
  key: string,
  label: string,
  max = 200,
  required = false,
): FieldConfig => ({ key, label, kind: "text", max, required });
const select = (
  key: string,
  label: string,
  options: string[],
  required = false,
): FieldConfig => ({ key, label, kind: "select", options, required });

export const resources: Record<string, ResourceConfig> = {
  clients: {
    key: "clients",
    endpoint: "clients",
    title: "Clients & people",
    singular: "client",
    eyebrow: "RELATIONSHIPS",
    searchable: true,
    statuses: ["ACTIVE", "INACTIVE"],
    deleteAction: "delete",
    description:
      "Keep buyers, sellers, property owners, and conversations close. Link each person to their properties or requirements as work develops.",
    columns: [
      { key: "name", label: "Name" },
      { key: "phone", label: "Phone" },
      { key: "email", label: "Email" },
      { key: "address", label: "Address" },
      { key: "notes", label: "Notes" },
      { key: "status", label: "Status", kind: "status" },
      { key: "createdAt", label: "Added", kind: "date" },
    ],
    fields: [
      text("name", "Full name", 150, true),
      { key: "phone", label: "Phone", kind: "tel", max: 40 },
      { key: "alternatePhone", label: "Alternate phone", kind: "tel", max: 40 },
      { key: "email", label: "Email", kind: "email", max: 320 },
      text("address", "Address", 500),
      text("source", "How you know them", 100),
      select("status", "Status", ["ACTIVE", "INACTIVE"]),
      { key: "notes", label: "Notes", kind: "textarea", max: 5000 },
    ],
  },
  properties: {
    key: "properties",
    endpoint: "properties",
    title: "Properties",
    singular: "property",
    eyebrow: "LISTINGS",
    searchable: true,
    statuses: [
      "DRAFT",
      "ACTIVE",
      "UNDER_NEGOTIATION",
      "RESERVED",
      "SOLD",
      "RENTED",
      "WITHDRAWN",
    ],
    deleteAction: "archive",
    description:
      "Record listings with the owner, location, price, and land details that matter in a real conversation.",
    columns: [
      { key: "title", label: "Property" },
      { key: "locality", label: "Location" },
      { key: "priceNpr", label: "Price", kind: "money" },
      { key: "landAreaValue", label: "Land", kind: "land" },
      { key: "status", label: "Status", kind: "status" },
    ],
    fields: [
      text("title", "Listing title", 200, true),
      text("code", "Reference code", 50),
      select("propertyType", "Property type", propertyTypes, true),
      select("transactionType", "For", transactionTypes, true),
      select("status", "Status", [
        "DRAFT",
        "ACTIVE",
        "UNDER_NEGOTIATION",
        "RESERVED",
        "SOLD",
        "RENTED",
        "WITHDRAWN",
        "ARCHIVED",
      ]),
      {
        ...ref("ownerClientId", "Saved owner / seller", "clients"),
        hint: "Select a saved client, enter a name below, or both.",
      },
      {
        ...text("clientName", "Owner / seller name", 50),
        hint: "Use this when the owner is not saved as a client.",
      },
      select("province", "Province", provinces),
      select("district", "District", []),
      select("municipality", "Municipality", []),
      text("locality", "Locality", 150),
      { key: "priceNpr", label: "Price (NPR)", kind: "money" },
      {
        key: "landAreaValue",
        label: "Land area",
        kind: "decimal",
        hint: "Enter a value and choose its unit.",
      },
      select("landAreaUnit", "Land unit", landUnits),
      { key: "builtUpAreaSqM", label: "Built-up area (m²)", kind: "decimal" },
      { key: "bedrooms", label: "Bedrooms", kind: "integer" },
      { key: "bathrooms", label: "Bathrooms", kind: "integer" },
      { key: "roadAccessMeters", label: "Road access (m)", kind: "decimal" },
      select("facing", "Facing", facings),
      {
        key: "description",
        label: "Description",
        kind: "textarea",
        max: 10000,
      },
      { key: "remarks", label: "Private remarks", kind: "textarea", max: 5000 },
    ],
  },
  requirements: {
    key: "requirements",
    endpoint: "requirements",
    title: "Buyer requirements",
    singular: "requirement",
    deleteAction: "delete",
    eyebrow: "WHAT BUYERS NEED",
    searchable: true,
    statuses: ["ACTIVE", "PAUSED", "CLOSED"],
    description:
      "Keep each buyer’s brief clear: location, budget, property type, and details worth remembering.",
    columns: [
      { key: "title", label: "Requirement" },
      { key: "buyerName", label: "Buyer" },
      { key: "propertyType", label: "Type" },
      { key: "maxBudgetNpr", label: "Up to", kind: "money" },
      { key: "status", label: "Status", kind: "status" },
    ],
    fields: [
      {
        ...ref("clientId", "Saved buyer client", "clients"),
        hint: "Optional. Link this requirement to a saved client.",
      },
      text("buyerName", "Buyer name", 150, true),
      { key: "buyerEmail", label: "Buyer email", kind: "email", max: 320 },
      { key: "buyerPhoneNo", label: "Buyer phone number", kind: "tel", max: 40, required: true },
      text("title", "Requirement title", 200),
      select("transactionType", "For", transactionTypes, true),
      select("propertyType", "Property type", propertyTypes, true),
      {
        key: "preferredLocations",
        label: "Preferred locations",
        kind: "locations",
        hint: "Add each area with its province, district, municipality, and localities.",
      },
      { key: "minBudgetNpr", label: "Minimum budget (NPR)", kind: "money" },
      { key: "maxBudgetNpr", label: "Maximum budget (NPR)", kind: "money" },
      {
        key: "minLandAreaSqM",
        label: "Minimum land area (m²)",
        kind: "decimal",
      },
      {
        key: "maxLandAreaSqM",
        label: "Maximum land area (m²)",
        kind: "decimal",
      },
      { key: "minBedrooms", label: "Minimum bedrooms", kind: "integer" },
      {
        key: "minRoadAccessMeters",
        label: "Minimum road access (m)",
        kind: "decimal",
      },
      select("status", "Status", ["ACTIVE", "PAUSED", "CLOSED"]),
      { key: "notes", label: "Notes", kind: "textarea", max: 5000 },
    ],
  },
  activities: {
    key: "activities",
    endpoint: "activities",
    title: "Activity & follow-ups",
    singular: "activity",
    eyebrow: "THE DAILY WORK",
    description:
      "Log calls, meetings, messages, notes, and what needs to happen next.",
    columns: [
      { key: "type", label: "Activity", kind: "status" },
      { key: "notes", label: "Note" },
      {
        key: "clientId",
        label: "Client",
        kind: "reference",
        reference: "clients",
      },
      { key: "occurredAt", label: "When", kind: "datetime" },
      { key: "followUpAt", label: "Follow-up", kind: "datetime" },
    ],
    fields: [
      select(
        "type",
        "Activity type",
        ["NOTE", "CALL", "MEETING", "FOLLOW_UP", "EMAIL", "MESSAGE"],
        true,
      ),
      {
        key: "notes",
        label: "What happened?",
        kind: "textarea",
        max: 5000,
        required: true,
      },
      {
        key: "occurredAt",
        label: "Occurred at",
        kind: "datetime",
        required: true,
      },
      { key: "followUpAt", label: "Follow up at", kind: "datetime" },
      ref("clientId", "Related client", "clients"),
      ref("propertyId", "Related property", "properties"),
      ref("requirementId", "Related requirement", "requirements"),
    ],
    deleteAction: "delete",
  },
  visits: {
    key: "visits",
    endpoint: "visits",
    title: "Property visits",
    singular: "visit",
    eyebrow: "ON THE GROUND",
    statuses: ["PLANNED", "COMPLETED", "CANCELLED"],
    description:
      "Plan viewings and keep the feedback next to the people and property involved.",
    columns: [
      {
        key: "propertyId",
        label: "Property",
        kind: "reference",
        reference: "properties",
      },
      {
        key: "clientId",
        label: "Client",
        kind: "reference",
        reference: "clients",
      },
      { key: "visitedAt", label: "Visit", kind: "datetime" },
      { key: "status", label: "Status", kind: "status" },
      { key: "feedback", label: "Feedback" },
    ],
    fields: [
      ref("clientId", "Client", "clients", true),
      ref("propertyId", "Property", "properties", true),
      ref("requirementId", "Buyer requirement", "requirements"),
      {
        key: "visitedAt",
        label: "Visit date & time",
        kind: "datetime",
        required: true,
      },
      select("status", "Status", ["PLANNED", "COMPLETED", "CANCELLED"]),
      { key: "feedback", label: "Feedback", kind: "textarea", max: 3000 },
      { key: "notes", label: "Private notes", kind: "textarea", max: 5000 },
    ],
  },
  deals: {
    key: "deals",
    endpoint: "deals",
    title: "Deals",
    singular: "deal",
    eyebrow: "FROM TALK TO AGREEMENT",
    statuses: ["OPEN", "NEGOTIATING", "WON", "LOST", "CANCELLED"],
    description:
      "Track negotiations, agreed prices, commissions, and the final outcome in one place.",
    columns: [
      {
        key: "propertyId",
        label: "Property",
        kind: "reference",
        reference: "properties",
      },
      {
        key: "clientId",
        label: "Buyer",
        kind: "reference",
        reference: "clients",
      },
      { key: "agreedPriceNpr", label: "Agreed", kind: "money" },
      { key: "status", label: "Status", kind: "status" },
      { key: "createdAt", label: "Opened", kind: "date" },
    ],
    fields: [
      ref("clientId", "Buyer", "clients", true),
      ref("propertyId", "Property", "properties", true),
      ref("requirementId", "Buyer requirement", "requirements"),
      select("status", "Status", [
        "OPEN",
        "NEGOTIATING",
        "WON",
        "LOST",
        "CANCELLED",
      ]),
      { key: "agreedPriceNpr", label: "Agreed price (NPR)", kind: "money" },
      { key: "commissionNpr", label: "Commission (NPR)", kind: "money" },
      { key: "notes", label: "Deal notes", kind: "textarea", max: 5000 },
    ],
  },
  notes: {
    key: "notes",
    endpoint: "activities",
    title: "Notes",
    singular: "note",
    eyebrow: "QUICK CONTEXT",
    fixedFilter: { type: "NOTE" },
    description:
      "Keep a note against a client, property, or buyer requirement. Notes are stored as activities.",
    columns: [
      { key: "notes", label: "Note" },
      {
        key: "clientId",
        label: "Client",
        kind: "reference",
        reference: "clients",
      },
      {
        key: "propertyId",
        label: "Property",
        kind: "reference",
        reference: "properties",
      },
      { key: "occurredAt", label: "Written", kind: "datetime" },
    ],
    fields: [
      {
        key: "notes",
        label: "Note",
        kind: "textarea",
        required: true,
        max: 5000,
      },
      {
        key: "occurredAt",
        label: "Written at",
        kind: "datetime",
        required: true,
      },
      ref("clientId", "Related client", "clients"),
      ref("propertyId", "Related property", "properties"),
      ref("requirementId", "Related requirement", "requirements"),
    ],
    deleteAction: "delete",
  },
};

resources.archived = {
  ...resources.properties,
  key: "archived",
  listEndpoint: "properties/archived",
  title: "Archived properties",
  eyebrow: "ARCHIVE",
  description: "Review archived listings, update their details, or delete them permanently.",
  statuses: undefined,
  deleteAction: "permanent-delete",
  allowCreate: false,
};
