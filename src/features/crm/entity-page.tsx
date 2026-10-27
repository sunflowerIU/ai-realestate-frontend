"use client";

import { useDeferredValue, useMemo, useState } from "react";
import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  tableFeatures,
  useTable,
  type CellContext,
  type ColumnDef,
} from "@tanstack/react-table";
import {
  ArrowLeft,
  ArrowRight,
  Archive,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import { RowActions } from "@/components/ui/row-actions";
import { toast } from "@/components/ui/toast";
import {
  actionRecord,
  listRecords,
  writeRecord,
  type RecordRow,
} from "@/lib/api/client";
import { formatBsDate, formatNpr, label } from "@/lib/formatting/nepal";
import type { ColumnConfig, ResourceConfig } from "./config";
import { RecordForm } from "./record-form";
import { LoadingIndicator } from "@/features/app/loading-indicator";

type Lookups = Record<string, RecordRow[]>;

const features = tableFeatures({});
const PAGE_SIZE = 20;

function valueFor(row: RecordRow, column: ColumnConfig, lookups: Lookups) {
  const value = row[column.key];
  if (column.key === "buyerName" && !value && row.clientId) {
    const client = lookups.clients?.find((item) => item.id === row.clientId);
    return client ? String(client.name || client.id) : `Record ${String(row.clientId).slice(0, 8)}`;
  }
  if (column.kind === "money") return formatNpr(value);
  if (column.kind === "date" || column.kind === "datetime")
    return formatBsDate(value, column.kind === "datetime");
  if (column.kind === "land")
    return value
      ? `${value} ${String(row.landAreaUnit || "").replaceAll("_", " ")}`
      : "—";
  if (column.kind === "reference") {
    const match = lookups[column.reference || ""]?.find(
      (item) => item.id === value,
    );
    return match
      ? String(
          match[column.reference === "clients" ? "name" : "title"] || match.id,
        )
      : value
        ? `Record ${String(value).slice(0, 8)}`
        : "—";
  }
  if (column.kind === "status")
    return (
      <span
        className={`app-status status-${String(value || "").toLowerCase()}`}
      >
        {label(value)}
      </span>
    );
  if (Array.isArray(value)) return value.join(", ") || "—";
  return value === null || value === undefined || value === ""
    ? "—"
    : String(value);
}

export function EntityPage({ config }: { config: ResourceConfig }) {
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search.trim());
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("newest");
  const [selected, setSelected] = useState<RecordRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RecordRow | null>(null);
  const [open, setOpen] = useState(false);
  const refs = useMemo(
    () =>
      Array.from(
        new Set(
          [
            ...config.fields.map((field) => field.reference),
            ...config.columns.map((column) => column.reference),
          ].filter((item): item is "clients" | "properties" | "requirements" =>
            Boolean(item),
          ),
        ),
      ),
    [config],
  );
  const lookupQueries = useQueries({
    queries: refs.map((name) => ({
      queryKey: ["records", name, "lookup"],
      queryFn: () => listRecords<RecordRow>(name, { page: 1, pageSize: 100 }),
      staleTime: 60_000,
    })),
  });
  const lookups = useMemo(
    () =>
      Object.fromEntries(
        refs.map((name, index) => [
          name,
          lookupQueries[index]?.data?.items || [],
        ]),
      ) as Lookups,
    [refs, lookupQueries],
  );
  const params = {
    page,
    pageSize: PAGE_SIZE,
    sort,
    ...(config.searchable && deferredSearch ? { search: deferredSearch } : {}),
    ...(status
      ? { [config.key === "activities" ? "type" : "status"]: status }
      : {}),
    ...config.fixedFilter,
  };
  const query = useQuery({
    queryKey: ["records", config.endpoint, config.key, params],
    queryFn: () => listRecords<RecordRow>(config.listEndpoint ?? config.endpoint, params),
  });
  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      writeRecord<RecordRow>(
        config.endpoint,
        selected ? "PATCH" : "POST",
        payload,
        selected?.id,
      ),
    onSuccess: async () => {
      setOpen(false);
      toast.success(
        selected ? `${config.singular} updated.` : `${config.singular} added.`,
      );
      await client.invalidateQueries({
        queryKey: ["records", config.endpoint],
      });
      await client.invalidateQueries({ queryKey: ["reference"] });
      await client.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => toast.error(error.message),
  });
  const action = useMutation({
    mutationFn: ({ id, kind }: { id: string; kind: "delete" | "archive" | "permanent-delete" }) =>
      actionRecord(
        config.endpoint,
        id,
        kind === "archive" ? "archive" : kind === "permanent-delete" ? "delete" : "",
        kind === "archive" ? "POST" : "DELETE",
      ),
    onSuccess: async () => {
      setOpen(false);
      setDeleteTarget(null);
      toast.success(
        config.deleteAction === "archive"
          ? "Property archived."
          : `${config.singular} deleted.`,
      );
      await client.invalidateQueries({
        queryKey: ["records", config.endpoint],
      });
      await client.invalidateQueries({ queryKey: ["reference"] });
      await client.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => toast.error(error.message),
  });
  const columns = useMemo<Array<ColumnDef<typeof features, RecordRow>>>(
    () => [
      {
        id: "serial",
        header: "S.N",
        cell: (info) => (page - 1) * PAGE_SIZE + info.row.index + 1,
      },
      ...config.columns.map((column) => ({
        accessorKey: column.key,
        header: column.label,
        cell: (info: CellContext<typeof features, RecordRow>) => (
          <span className={column.key === "notes" ? "cell-clip" : ""}>
            {valueFor(info.row.original, column, lookups)}
          </span>
        ),
      })),
      {
        id: "actions",
        header: "Actions",
        cell: (info) => (
          <RowActions
            actions={[
              {
                label: "Edit",
                icon: <Pencil size={15} />,
                onClick: () => {
                  setSelected(info.row.original);
                  setOpen(true);
                },
              },
              ...(config.deleteAction
                ? [{
                    label:
                      config.deleteAction === "archive"
                        ? "Archive property"
                        : `Delete ${config.singular}`,
                    icon:
                      config.deleteAction === "archive" ? (
                        <Archive size={15} />
                      ) : (
                        <Trash2 size={15} />
                      ),
                    onClick: () => setDeleteTarget(info.row.original),
                    destructive: true,
                  }]
                : []),
            ]}
          />
        ),
      },
    ],
    [config, lookups, page],
  );
  const table = useTable({ features, data: query.data?.items || [], columns });
  function startNew() {
    setSelected(null);
    setOpen(true);
  }
  return (
    <div className="resource-page">
      <div className="app-page-heading">
        <div>
          <div className="app-eyebrow">
            {config.eyebrow} <span>/ RECORDS</span>
          </div>
          <h1>
            {config.title}
            <span>.</span>
          </h1>
          <p>{config.description}</p>
        </div>
        {config.allowCreate !== false && (
          <Button onClick={startNew}>
            <Plus size={17} /> Add {config.singular}
          </Button>
        )}
      </div>
      <div className="resource-toolbar">
        {config.searchable && (
          <label className="resource-search">
            <Search size={17} />
            <span className="sr-only">Search {config.title}</span>
            <Input
              placeholder={`Search ${config.title.toLowerCase()}…`}
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>
        )}
        <div className="toolbar-filters">
          {config.statuses && (
            <label>
              <span className="sr-only">Filter by status</span>
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">All statuses</option>
                {config.statuses.map((item) => (
                  <option key={item} value={item}>
                    {label(item)}
                  </option>
                ))}
              </select>
            </label>
          )}
          {config.key === "activities" && (
            <label>
              <span className="sr-only">Filter by activity type</span>
              <select
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(1);
                }}
              >
                <option value="">All activity types</option>
                {[
                  "NOTE",
                  "CALL",
                  "MEETING",
                  "FOLLOW_UP",
                  "EMAIL",
                  "MESSAGE",
                ].map((item) => (
                  <option key={item} value={item}>
                    {label(item)}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label>
            <span className="sr-only">Sort records</span>
            <select
              value={sort}
              onChange={(event) => {
                setSort(event.target.value);
                setPage(1);
              }}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              {config.key === "clients" && (
                <>
                  <option value="name_asc">Name A–Z</option>
                  <option value="name_desc">Name Z–A</option>
                </>
              )}
              {(config.key === "properties" || config.key === "archived") && (
                <>
                  <option value="price_asc">Price: low to high</option>
                  <option value="price_desc">Price: high to low</option>
                </>
              )}
            </select>
          </label>
        </div>
      </div>
      <div className="resource-card">
        <div className="resource-card-top">
          <span>
            {query.data ? `${query.data.pagination.total} RECORDS` : "RECORDS"}
          </span>
          <span>YOUR PRIVATE WORKSPACE</span>
        </div>
        {query.isPending ? (
          <div className="resource-state">
            <LoadingIndicator label={`Loading ${config.title.toLowerCase()}`} />
          </div>
        ) : query.error ? (
          <div className="resource-state">
            <strong>Couldn’t load these records.</strong>
            <Button variant="outline" onClick={() => void query.refetch()}>
              Try again
            </Button>
          </div>
        ) : query.data?.items.length === 0 ? (
          <div className="resource-state empty">
            <span className="empty-symbol">✳</span>
            <strong>
              {search || status
                ? "No records match those filters."
                : config.key === "archived"
                  ? "No archived properties yet."
                  : `Your ${config.title.toLowerCase()} start here.`}
            </strong>
            <p>
              {search || status
                ? "Try a different search or status."
                : config.key === "archived"
                  ? "Properties you archive will appear here."
                  : `Add your first ${config.singular} to keep the details close.`}
            </p>
            {!search && !status && config.allowCreate !== false && (
              <Button variant="outline" onClick={startNew}>
                <Plus size={16} /> Add {config.singular}
              </Button>
            )}
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                {table.getHeaderGroups().map((group) => (
                  <tr key={group.id}>
                    {group.headers.map((header) => (
                      <th key={header.id}>
                        <table.FlexRender header={header} />
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => (
                  <tr key={row.id}>
                    {row.getAllCells().map((cell) => (
                      <td key={cell.id}>
                        <table.FlexRender cell={cell} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="resource-pagination">
          <span>
            Page {query.data?.pagination.page || page} of{" "}
            {Math.max(query.data?.pagination.totalPages || 1, 1)}
          </span>
          <div>
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              aria-label="Previous page"
            >
              <ArrowLeft size={18} />
            </button>
            <button
              disabled={page >= (query.data?.pagination.totalPages || 1)}
              onClick={() => setPage(page + 1)}
              aria-label="Next page"
            >
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <div className="dialog-heading">
            <div className="app-eyebrow">
              {selected ? "EDIT RECORD" : "NEW RECORD"}
            </div>
            <DialogTitle>
              {selected ? `Edit ${config.singular}` : `Add ${config.singular}`}
            </DialogTitle>
            <DialogDescription>
              {selected
                ? "Update the details below. Changes are saved to your private workspace."
                : "Add the details you know now. You can come back to complete the rest."}
            </DialogDescription>
          </div>
          <RecordForm
            key={selected?.id || "new"}
            config={config}
            row={selected || undefined}
            onSave={(payload) => save.mutate(payload)}
            saving={save.isPending}
          />
        </DialogContent>
      </Dialog>
      <DeleteDialog
        key={deleteTarget?.id || "none"}
        open={Boolean(deleteTarget)}
        onOpenChange={(next) => {
          if (!next) setDeleteTarget(null);
        }}
        title={
          config.deleteAction === "archive"
            ? "Archive this property?"
            : `Delete this ${config.singular}?`
        }
        description={
          config.deleteAction === "archive"
            ? "This property will be moved to archived records. You can find it in Archived."
            : `This ${config.singular} will be permanently deleted. This action cannot be undone.`
        }
        confirmationText={
          config.key === "clients" || config.endpoint === "properties"
            ? "yes"
            : undefined
        }
        confirmLabel={
          config.deleteAction === "archive"
            ? "Archive property"
            : `Delete ${config.singular}`
        }
        pending={action.isPending}
        onConfirm={() => {
          if (deleteTarget && config.deleteAction)
            action.mutate({ id: deleteTarget.id, kind: config.deleteAction });
        }}
      />
    </div>
  );
}
