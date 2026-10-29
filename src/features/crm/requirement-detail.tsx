"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowUpRight,
  BedDouble,
  CalendarDays,
  Check,
  Home,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Ruler,
  Route,
  Trash2,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteDialog } from "@/components/ui/delete-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import {
  actionRecord,
  getRecord,
  writeRecord,
  type RecordRow,
} from "@/lib/api/client";
import { formatBsDate, formatNpr, label } from "@/lib/formatting/nepal";
import { LoadingIndicator } from "@/features/app/loading-indicator";
import { resources } from "./config";
import { parsePreferredLocations } from "./preferred-locations";
import { RecordForm } from "./record-form";

type Requirement = RecordRow & {
  title?: string | null;
  buyerName?: string | null;
  buyerEmail?: string | null;
  buyerPhoneNo?: string | null;
  clientId?: string | null;
  transactionType?: string;
  propertyType?: string;
  status?: string;
  minBudgetNpr?: string | null;
  maxBudgetNpr?: string | null;
  minLandAreaSqMm?: string | null;
  maxLandAreaSqMm?: string | null;
  minBedrooms?: number | null;
  minRoadAccessMeters?: string | null;
  notes?: string | null;
};

const requirementConfig = resources.requirements;

function hasValue(value: unknown) {
  return value !== null && value !== undefined && value !== "";
}

function areaInSquareMeters(value: unknown) {
  if (!hasValue(value)) return null;
  try {
    const amount = BigInt(String(value));
    const fraction = String(amount % 1_000_000n)
      .padStart(6, "0")
      .replace(/0+$/, "");
    return `${amount / 1_000_000n}${fraction ? `.${fraction}` : ""} m²`;
  } catch {
    return null;
  }
}

function range(low: string | null, high: string | null) {
  if (low && high) return `${low} – ${high}`;
  if (low) return `From ${low}`;
  if (high) return `Up to ${high}`;
  return "Not specified";
}

function DetailItem({
  icon: Icon,
  label: itemLabel,
  value,
}: {
  icon: typeof Home;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 items-start gap-3 border-b border-[var(--app-border)] py-5 pr-2 max-[420px]:border-b [&:nth-child(even)]:border-l [&:nth-child(even)]:pl-5 max-[420px]:[&:nth-child(even)]:border-l-0 max-[420px]:[&:nth-child(even)]:pl-0">
      <span className="grid size-8 shrink-0 place-items-center rounded-md border border-[var(--app-border)] bg-[var(--app-soft)] text-[var(--app-accent)]">
        <Icon size={18} strokeWidth={1.8} />
      </span>
      <span className="min-w-0">
        <small className="mb-1.5 block text-[10px] text-[var(--app-muted)]">{itemLabel}</small>
        <strong className="block text-xs leading-[1.45] font-bold wrap-anywhere text-[var(--app-ink)]">{value}</strong>
      </span>
    </div>
  );
}

export function RequirementDetail({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const {
    data: requirement,
    isPending,
    error,
    refetch,
  } = useQuery({
    queryKey: ["record", "requirements", id],
    queryFn: () => getRecord<Requirement>("requirements", id),
    retry: false,
  });
  const clientId = requirement?.clientId;
  const { data: linkedClient } = useQuery({
    queryKey: ["record", "clients", clientId],
    queryFn: () => getRecord<RecordRow>("clients", clientId!),
    enabled: Boolean(clientId),
    retry: false,
  });
  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      writeRecord<Requirement>("requirements", "PATCH", payload, id),
    onSuccess: async (updated) => {
      queryClient.setQueryData(["record", "requirements", id], updated);
      setEditOpen(false);
      toast.success("Requirement updated.");
      await queryClient.invalidateQueries({
        queryKey: ["records", "requirements"],
      });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });
  const remove = useMutation({
    mutationFn: () => actionRecord("requirements", id, "delete", "DELETE"),
    onSuccess: async () => {
      toast.success("Requirement deleted.");
      await queryClient.invalidateQueries({
        queryKey: ["records", "requirements"],
      });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.replace("/workspace/requirements");
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });

  if (isPending)
    return (
      <div className="flex min-h-[430px] flex-col items-center justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-9 text-center">
        <LoadingIndicator label="Loading buyer requirement" />
      </div>
    );
  if (error || !requirement)
    return (
      <div className="flex min-h-[430px] flex-col items-center justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-9 text-center">
        <div className="text-[10px] font-extrabold tracking-[.18em] text-[var(--app-accent)]">BUYER REQUIREMENT</div>
        <h1 className="my-4 font-[family-name:var(--font-display)] text-[clamp(28px,4vw,42px)] font-bold tracking-[-.05em]">We couldn’t open this requirement.</h1>
        <p className="max-w-[380px] text-xs leading-relaxed text-[var(--app-muted)]">
          It may have been deleted, or the record is unavailable to your
          account.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button variant="outline" onClick={() => void refetch()}>
            Try again
          </Button>
          <Button asChild>
            <Link href="/workspace/requirements">Back to requirements</Link>
          </Button>
        </div>
      </div>
    );

  const title = requirement.title?.trim() || "Untitled requirement";
  const buyer =
    requirement.buyerName?.trim() ||
    String(linkedClient?.name || "Buyer not named");
  const locations = parsePreferredLocations(requirement.preferredLocations);
  const minimumBudget = hasValue(requirement.minBudgetNpr)
    ? formatNpr(requirement.minBudgetNpr)
    : null;
  const maximumBudget = hasValue(requirement.maxBudgetNpr)
    ? formatNpr(requirement.maxBudgetNpr)
    : null;
  const area = range(
    areaInSquareMeters(requirement.minLandAreaSqMm),
    areaInSquareMeters(requirement.maxLandAreaSqMm),
  );
  const status = String(requirement.status || "ACTIVE");
  const statusTone = status === "PAUSED"
    ? "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200"
    : status === "CLOSED"
      ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200"
      : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200";
  const badgeClass = `inline-flex items-center rounded-full px-2.5 py-1.5 text-[10px] font-extrabold ${statusTone}`;

  return (
    <div className="mx-auto max-w-[1240px]">
      <div className="mb-8 flex items-center justify-between gap-5 text-[10px] font-bold tracking-[.09em] text-[var(--app-muted)] max-[580px]:[&>span]:hidden">
        <Link className="inline-flex items-center gap-2.5 text-xs font-bold tracking-normal text-[var(--app-ink)] transition-colors hover:text-[var(--app-accent)]" href="/workspace/requirements">
          <ArrowLeft size={16} /> All requirements
        </Link>
        <span>
          BUYER REQUIREMENT <span className="px-2 text-[var(--app-accent)]">/</span> {id.slice(0, 8).toUpperCase()}
        </span>
      </div>

      <div className="mb-7 flex items-end justify-between gap-8 max-[760px]:block">
        <div>
          <div className="text-[10px] font-extrabold tracking-[.18em] text-[var(--app-accent)]">
            BUYER PROFILE <span className="text-[var(--app-muted)]">/ REQUIREMENT DETAILS</span>
          </div>
          <h1 className="my-3 max-w-[850px] font-[family-name:var(--font-display)] text-[clamp(38px,4.2vw,64px)] leading-[1.06] font-bold tracking-[-.06em] wrap-anywhere text-[var(--app-ink)] max-[580px]:text-[clamp(36px,10vw,49px)]">
            {title}
            <span className="text-[var(--app-accent)]">.</span>
          </h1>
          <p className="m-0 text-[13px] leading-relaxed text-[var(--app-muted)]">Everything this buyer is looking for, together in one place.</p>
        </div>
        <div className="flex shrink-0 gap-2 pb-1 max-[760px]:mt-5 max-[580px]:w-full max-[580px]:[&>button:first-child]:flex-1">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil size={16} /> Edit requirement
          </Button>
          <Button
            variant="outline"
            className="!w-11 !px-0 !text-rose-600 hover:!border-rose-500 hover:!bg-rose-50"
            onClick={() => setDeleteOpen(true)}
            aria-label="Delete requirement"
          >
            <Trash2 size={16} />
          </Button>
        </div>
      </div>

      <section className="mb-6 grid min-h-[258px] grid-cols-[minmax(0,1.25fr)_minmax(270px,.75fr)] overflow-hidden rounded-xl border border-[#2e4978] bg-[#183364] text-white shadow-[0_14px_34px_#1834601c] max-[1100px]:grid-cols-[minmax(0,1fr)_minmax(250px,.8fr)] max-[760px]:grid-cols-1" aria-label="Requirement overview">
        <div className="relative isolate flex flex-col justify-between gap-8 overflow-hidden p-8 max-[760px]:min-h-[245px] max-[580px]:p-6">
          <div className="relative z-10 flex items-center justify-between gap-4">
            <span className="text-[10px] font-extrabold tracking-[.18em] text-[#a8c4f7]">THE BUYER BRIEF</span>
            <span className={badgeClass}>
              {label(status)}
            </span>
          </div>
          <div className="relative z-10">
            <span className="mb-1.5 block text-xs text-[#b3c8ea]">Looking for</span>
            <h2 className="m-0 max-w-[600px] font-[family-name:var(--font-display)] text-[clamp(31px,3.1vw,49px)] leading-[1.08] font-bold tracking-[-.045em] max-[580px]:text-[30px]">
              {label(requirement.propertyType)}{" "}
              <span className="text-[#9dbcf9]">
                for {label(requirement.transactionType).toLowerCase()}
              </span>
            </h2>
          </div>
          <div className="relative z-10 flex items-center gap-2 text-xs text-[#d4e2fc]">
            <UserRound size={17} />{" "}
            <span>
              For <strong className="font-bold text-white">{buyer}</strong>
            </span>
          </div>
        </div>
        <div className="relative flex flex-col items-start justify-center overflow-hidden border-l border-white/10 bg-gradient-to-br from-[#214781] to-[#142b57] p-9 max-[760px]:min-h-[158px] max-[760px]:border-t max-[760px]:border-l-0 max-[580px]:p-6">
          <span className="text-[10px] font-extrabold tracking-[.18em] text-[#a8c4f7]">INDICATIVE BUDGET</span>
          <div className="relative z-10 my-4 flex flex-col items-start gap-0.5">
            {minimumBudget && maximumBudget ? (
              <>
                <strong className="font-[family-name:var(--font-display)] text-[clamp(24px,2.2vw,31px)] leading-[1.18] font-bold tracking-[-.045em] wrap-anywhere">{minimumBudget}</strong>
                <em className="my-0.5 font-sans text-[9px] font-extrabold not-italic tracking-[.18em] text-[#a8c4f7]">TO</em>
                <strong className="font-[family-name:var(--font-display)] text-[clamp(24px,2.2vw,31px)] leading-[1.18] font-bold tracking-[-.045em] wrap-anywhere">{maximumBudget}</strong>
              </>
            ) : (
              <strong className="font-[family-name:var(--font-display)] text-[clamp(24px,2.2vw,31px)] leading-[1.18] font-bold tracking-[-.045em] wrap-anywhere">{range(minimumBudget, maximumBudget)}</strong>
            )}
          </div>
          <small className="relative z-10 text-[11px] text-[#bdd1f2]">Budget in Nepalese rupees</small>
          <div className="pointer-events-none absolute -right-3 -bottom-8 rotate-[-12deg] font-[family-name:var(--font-display)] text-[140px] leading-none font-bold text-white/[.05]" aria-hidden="true">
            रु
          </div>
        </div>
      </section>

      <div className="grid grid-cols-[minmax(0,1.58fr)_minmax(270px,.72fr)] items-start gap-6 max-[1100px]:grid-cols-[minmax(0,1.2fr)_minmax(250px,.8fr)] max-[760px]:grid-cols-1">
        <div className="grid min-w-0 gap-5">
          <section className="overflow-hidden rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[0_7px_22px_#253b6410] dark:shadow-none">
            <div className="flex items-center justify-between gap-5 border-b border-[var(--app-border)] px-7 py-6 max-[580px]:px-5 max-[580px]:py-5">
              <div>
                <span className="text-[9px] font-extrabold tracking-[.17em] text-[var(--app-accent)]">01 / LOCATION</span>
                <h2 className="mt-2 mb-0 font-[family-name:var(--font-display)] text-[23px] leading-tight font-bold tracking-[-.04em]">Preferred places</h2>
              </div>
              <MapPin size={21} strokeWidth={1.7} className="text-[var(--app-accent)]" />
            </div>
            {locations.length ? (
              <div className="px-7 py-1 max-[580px]:px-5">
                {locations.map((place, index) => (
                  <div
                    className="grid grid-cols-[34px_minmax(0,1fr)_20px] items-start gap-4 border-b border-[var(--app-border)] py-5 last:border-0"
                    key={`${place.province}-${place.district}-${place.municipality}-${index}`}
                  >
                    <div className="grid size-8 place-items-center rounded-md bg-[var(--app-soft)] text-[10px] font-extrabold text-[var(--app-accent)]">
                      {String(index + 1).padStart(2, "0")}
                    </div>
                    <div>
                      <h3 className="m-0 text-sm leading-snug font-bold text-[var(--app-ink)]">
                        {place.municipality || "Municipality not specified"}
                      </h3>
                      <p className="mt-1 mb-0 text-[11px] text-[var(--app-muted)]">
                        {[place.district, place.province]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                      {place.localities.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {place.localities.map((locality) => (
                            <span className="rounded-full border border-[var(--app-border)] bg-[var(--app-soft)] px-2.5 py-1.5 text-[10px] font-semibold text-[var(--app-muted)]" key={locality}>{locality}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Check size={16} className="mt-2 text-[var(--app-accent)]" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="m-0 p-7 text-xs text-[var(--app-muted)]">
                No preferred areas have been added yet.
              </p>
            )}
          </section>

          <section className="overflow-hidden rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[0_7px_22px_#253b6410] dark:shadow-none">
            <div className="flex items-center justify-between gap-5 border-b border-[var(--app-border)] px-7 py-6 max-[580px]:px-5 max-[580px]:py-5">
              <div>
                <span className="text-[9px] font-extrabold tracking-[.17em] text-[var(--app-accent)]">02 / CRITERIA</span>
                <h2 className="mt-2 mb-0 font-[family-name:var(--font-display)] text-[23px] leading-tight font-bold tracking-[-.04em]">Property preferences</h2>
              </div>
              <Home size={21} strokeWidth={1.7} className="text-[var(--app-accent)]" />
            </div>
            <div className="grid grid-cols-2 px-7 pb-2 max-[580px]:px-5 max-[420px]:grid-cols-1">
              <DetailItem
                icon={Home}
                label="Property type"
                value={label(requirement.propertyType)}
              />
              <DetailItem
                icon={ArrowUpRight}
                label="Transaction"
                value={label(requirement.transactionType)}
              />
              <DetailItem icon={Ruler} label="Land area" value={area} />
              <DetailItem
                icon={BedDouble}
                label="Minimum bedrooms"
                value={
                  hasValue(requirement.minBedrooms)
                    ? String(requirement.minBedrooms)
                    : "Not specified"
                }
              />
              <DetailItem
                icon={Route}
                label="Minimum road access"
                value={
                  hasValue(requirement.minRoadAccessMeters)
                    ? `${requirement.minRoadAccessMeters} m`
                    : "Not specified"
                }
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[0_7px_22px_#253b6410] dark:shadow-none">
            <div className="flex items-center justify-between gap-5 border-b border-[var(--app-border)] px-7 py-6 max-[580px]:px-5 max-[580px]:py-5">
              <div>
                <span className="text-[9px] font-extrabold tracking-[.17em] text-[var(--app-accent)]">03 / CONTEXT</span>
                <h2 className="mt-2 mb-0 font-[family-name:var(--font-display)] text-[23px] leading-tight font-bold tracking-[-.04em]">Notes & context</h2>
              </div>
            </div>
            <p className="m-0 px-7 py-6 text-xs leading-[1.8] whitespace-pre-wrap wrap-anywhere text-[var(--app-muted)] max-[580px]:px-5">
              {requirement.notes?.trim() ||
                "No additional notes yet. Add context that helps you find the right property."}
            </p>
          </section>
        </div>

        <aside
          className="grid min-w-0 gap-5 max-[760px]:grid-cols-2 max-[580px]:grid-cols-1"
          aria-label="Buyer and record information"
        >
          <section className="overflow-hidden rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-[0_7px_22px_#253b6410] dark:shadow-none">
            <div className="flex items-center justify-between text-[var(--app-accent)]">
              <span className="text-[9px] font-extrabold tracking-[.17em]">BUYER CONTACT</span>
              <UserRound size={18} />
            </div>
            <div className="mt-6 grid size-[58px] place-items-center rounded-[14px] bg-[#e4edff] font-[family-name:var(--font-display)] text-[29px] font-bold text-[#2859b8] dark:bg-[#2b477e] dark:text-[#d3e0ff]" aria-hidden="true">
              {buyer.charAt(0).toUpperCase()}
            </div>
            <h2 className="mt-4 mb-1 font-[family-name:var(--font-display)] text-2xl leading-tight font-bold tracking-[-.04em] wrap-anywhere">{buyer}</h2>
            <p className="m-0 text-[11px] text-[var(--app-muted)]">
              {requirement.clientId
                ? "Linked to a saved client"
                : "Buyer on this requirement"}
            </p>
            <div className="mt-6 grid gap-2 border-t border-[var(--app-border)] pt-5">
              {requirement.buyerPhoneNo && (
                <a className="flex min-h-10 items-center gap-2.5 rounded-md border border-[var(--app-border)] px-3 py-2 text-[11px] font-semibold text-[var(--app-ink)] transition-colors hover:border-[var(--app-accent)] hover:bg-[var(--app-soft)]" href={`tel:${requirement.buyerPhoneNo}`}>
                  <Phone size={16} className="text-[var(--app-accent)]" />
                  <span className="min-w-0 flex-1 wrap-anywhere">{requirement.buyerPhoneNo}</span>
                  <ArrowUpRight size={14} className="text-[var(--app-muted)]" />
                </a>
              )}
              {requirement.buyerEmail && (
                <a className="flex min-h-10 items-center gap-2.5 rounded-md border border-[var(--app-border)] px-3 py-2 text-[11px] font-semibold text-[var(--app-ink)] transition-colors hover:border-[var(--app-accent)] hover:bg-[var(--app-soft)]" href={`mailto:${requirement.buyerEmail}`}>
                  <Mail size={16} className="text-[var(--app-accent)]" />
                  <span className="min-w-0 flex-1 wrap-anywhere">{requirement.buyerEmail}</span>
                  <ArrowUpRight size={14} className="text-[var(--app-muted)]" />
                </a>
              )}
            </div>
          </section>
          <section className="overflow-hidden rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-6 shadow-[0_7px_22px_#253b6410] dark:shadow-none">
            <span className="text-[9px] font-extrabold tracking-[.17em] text-[var(--app-accent)]">RECORD DETAILS</span>
            <dl className="mt-3 mb-0">
              <div className="flex min-h-[50px] items-center justify-between gap-3 border-b border-[var(--app-border)]">
                <dt className="text-[10px] text-[var(--app-muted)]">Status</dt>
                <dd className="m-0 text-right text-[10px] font-bold">
                  <span className={badgeClass}>
                    {label(status)}
                  </span>
                </dd>
              </div>
              <div className="flex min-h-[50px] items-center justify-between gap-3 border-b border-[var(--app-border)]">
                <dt className="flex items-center gap-2 text-[10px] text-[var(--app-muted)]">
                  <CalendarDays size={15} /> Created
                </dt>
                <dd className="m-0 text-right text-[10px] font-bold text-[var(--app-ink)]">{formatBsDate(requirement.createdAt)}</dd>
              </div>
              <div className="flex min-h-[50px] items-center justify-between gap-3 border-b border-[var(--app-border)]">
                <dt className="flex items-center gap-2 text-[10px] text-[var(--app-muted)]">
                  <CalendarDays size={15} /> Updated
                </dt>
                <dd className="m-0 text-right text-[10px] font-bold text-[var(--app-ink)]">{formatBsDate(requirement.updatedAt)}</dd>
              </div>
              <div className="flex min-h-[50px] items-center justify-between gap-3">
                <dt className="text-[10px] text-[var(--app-muted)]">Reference ID</dt>
                <dd className="m-0 text-right text-[10px] font-bold tracking-[.09em] text-[var(--app-accent)]">
                  {id.slice(0, 8).toUpperCase()}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <div className="border-b border-[var(--app-border)] px-9 pt-8 pb-6 max-[580px]:px-5 max-[580px]:pt-6">
            <div className="text-[10px] font-extrabold tracking-[.18em] text-[var(--app-accent)]">EDIT RECORD</div>
            <DialogTitle>Edit requirement</DialogTitle>
            <DialogDescription>
              Update the buyer brief. Changes are saved to your private
              workspace.
            </DialogDescription>
          </div>
          <RecordForm
            config={requirementConfig}
            row={requirement}
            onSave={(payload) => save.mutate(payload)}
            saving={save.isPending}
          />
        </DialogContent>
      </Dialog>
      <DeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this requirement?"
        description="This requirement will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete requirement"
        pending={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
    </div>
  );
}
