"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive,
  ArrowLeft,
  ArrowUpRight,
  Bath,
  BedDouble,
  Building2,
  CalendarDays,
  Compass,
  Home,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Route,
  Ruler,
  Trash2,
  UserRound,
  type LucideIcon,
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
import { actionRecord, getRecord, writeRecord, type RecordRow } from "@/lib/api/client";
import { formatBsDate, formatNpr, label } from "@/lib/formatting/nepal";
import { LoadingIndicator } from "@/features/app/loading-indicator";
import { provinceNamesByNumber, provinceNumber, resources } from "./config";
import { RecordForm } from "./record-form";

type Property = RecordRow & {
  title: string;
  code?: string | null;
  propertyType?: string;
  transactionType?: string;
  status?: string;
  ownerClientId?: string | null;
  clientName?: string | null;
  province?: string | null;
  district?: string | null;
  municipality?: string | null;
  locality?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  priceNpr?: string | null;
  landAreaValue?: string | null;
  landAreaUnit?: string | null;
  landAreaSqMm?: string | null;
  builtUpAreaSqMm?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
  roadAccessMeters?: string | null;
  facing?: string | null;
  description?: string | null;
  remarks?: string | null;
};

const cardClass = "overflow-hidden rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] shadow-[0_7px_22px_#253b6410]";
const panelHeadingClass = "flex items-center justify-between gap-5 border-b border-[var(--app-border)] px-7 py-6 max-[580px]:px-5 max-[580px]:py-5";
const eyebrowClass = "text-[9px] font-extrabold tracking-[.17em] text-[var(--app-accent)]";
const panelTitleClass = "mt-2 mb-0 font-[family-name:var(--font-display)] text-[23px] leading-tight font-bold tracking-[-.04em]";

function hasValue(value: unknown) {
  return value !== null && value !== undefined && value !== "";
}

function squareMeters(value: unknown) {
  if (!hasValue(value)) return null;
  try {
    const amount = BigInt(String(value));
    const fraction = String(amount % 1_000_000n).padStart(6, "0").replace(/0+$/, "");
    return `${amount / 1_000_000n}${fraction ? `.${fraction}` : ""} m²`;
  } catch {
    return null;
  }
}

function Fact({ icon: Icon, name, value }: { icon: LucideIcon; name: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3 border-b border-[var(--app-border)] py-5 pr-3 even:border-l even:pl-5 max-[480px]:even:border-l-0 max-[480px]:even:pl-0">
      <span className="grid size-8 shrink-0 place-items-center rounded-md border border-[var(--app-border)] bg-[var(--app-soft)] text-[var(--app-accent)]"><Icon size={18} strokeWidth={1.8} /></span>
      <span className="min-w-0"><small className="mb-1.5 block text-[10px] text-[var(--app-muted)]">{name}</small><strong className="block text-xs leading-[1.45] font-bold wrap-anywhere text-[var(--app-ink)]">{value}</strong></span>
    </div>
  );
}

export function PropertyDetail({ id }: { id: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [actionOpen, setActionOpen] = useState(false);
  const { data: property, isPending, error, refetch } = useQuery({
    queryKey: ["record", "properties", id],
    queryFn: () => getRecord<Property>("properties", id),
    retry: false,
  });
  const ownerId = property?.ownerClientId;
  const { data: ownerClient } = useQuery({
    queryKey: ["record", "clients", ownerId],
    queryFn: () => getRecord<RecordRow>("clients", ownerId!),
    enabled: Boolean(ownerId),
    retry: false,
  });
  const save = useMutation({
    mutationFn: (payload: Record<string, unknown>) => writeRecord<Property>("properties", "PATCH", payload, id),
    onSuccess: async (updated) => {
      queryClient.setQueryData(["record", "properties", id], updated);
      setEditOpen(false);
      toast.success("Property updated.");
      await queryClient.invalidateQueries({ queryKey: ["records", "properties"] });
      await queryClient.invalidateQueries({ queryKey: ["reference"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });
  const archive = useMutation({
    mutationFn: () => actionRecord("properties", id, "archive", "POST"),
    onSuccess: async () => {
      setActionOpen(false);
      toast.success("Property archived.");
      await queryClient.invalidateQueries({ queryKey: ["record", "properties", id] });
      await queryClient.invalidateQueries({ queryKey: ["records", "properties"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });
  const remove = useMutation({
    mutationFn: () => actionRecord("properties", id, "delete", "DELETE"),
    onSuccess: async () => {
      toast.success("Property deleted.");
      await queryClient.invalidateQueries({ queryKey: ["records", "properties"] });
      await queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      router.replace("/workspace/archived");
    },
    onError: (mutationError) => toast.error(mutationError.message),
  });

  if (isPending) return <div className="flex min-h-[430px] items-center justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)]"><LoadingIndicator label="Loading property" /></div>;
  if (error || !property) return (
    <div className="flex min-h-[430px] flex-col items-center justify-center rounded-lg border border-[var(--app-border)] bg-[var(--app-surface)] p-9 text-center">
      <span className={eyebrowClass}>PROPERTY RECORD</span>
      <h1 className="my-4 font-[family-name:var(--font-display)] text-[clamp(28px,4vw,42px)] font-bold tracking-[-.05em]">We couldn’t open this property.</h1>
      <p className="max-w-[380px] text-xs leading-relaxed text-[var(--app-muted)]">It may have been deleted, or the record is unavailable to your account.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-2"><Button variant="outline" onClick={() => void refetch()}>Try again</Button><Button asChild><Link href="/workspace/properties">Back to properties</Link></Button></div>
    </div>
  );

  const archived = property.status === "ARCHIVED";
  const backHref = archived ? "/workspace/archived" : "/workspace/properties";
  const backLabel = archived ? "Archived properties" : "All properties";
  const status = String(property.status || "DRAFT");
  const statusTone = status === "ARCHIVED" || status === "WITHDRAWN"
    ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200"
    : status === "DRAFT" || status === "UNDER_NEGOTIATION" || status === "RESERVED"
      ? "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200"
      : "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200";
  const badgeClass = `inline-flex items-center rounded-full px-2.5 py-1.5 text-[10px] font-extrabold ${statusTone}`;
  const ownerName = property.clientName?.trim() || String(ownerClient?.name || "Owner not recorded");
  const ownerPhone = ownerClient?.phone ? String(ownerClient.phone) : null;
  const ownerEmail = ownerClient?.email ? String(ownerClient.email) : null;
  const province = property.province ? (provinceNamesByNumber[provinceNumber(property.province) ?? ""] || property.province) : null;
  const locationParts = [property.locality, property.municipality, property.district, province].filter(Boolean);
  const location = locationParts.join(" · ") || "Location not specified";
  const landArea = property.landAreaValue && property.landAreaUnit
    ? `${property.landAreaValue} ${label(property.landAreaUnit)}`
    : squareMeters(property.landAreaSqMm) || "Not specified";
  const price = hasValue(property.priceNpr) ? formatNpr(property.priceNpr) : "Price on request";

  return (
    <div className="mx-auto max-w-[1240px]">
      <div className="mb-8 flex items-center justify-between gap-5 text-[10px] font-bold tracking-[.09em] text-[var(--app-muted)] max-[580px]:[&>span]:hidden">
        <Link href={backHref} className="inline-flex items-center gap-2.5 text-xs font-bold tracking-normal text-[var(--app-ink)] transition-colors hover:text-[var(--app-accent)]"><ArrowLeft size={16} /> {backLabel}</Link>
        <span>PROPERTY RECORD <span className="px-2 text-[var(--app-accent)]">/</span> {property.code || id.slice(0, 8).toUpperCase()}</span>
      </div>

      <div className="mb-7 flex items-end justify-between gap-8 max-[760px]:block">
        <div>
          <div className="text-[10px] font-extrabold tracking-[.18em] text-[var(--app-accent)]">LISTING PROFILE <span className="text-[var(--app-muted)]">/ PROPERTY DETAILS</span></div>
          <h1 className="my-3 max-w-[850px] font-[family-name:var(--font-display)] text-[clamp(38px,4.2vw,64px)] leading-[1.06] font-bold tracking-[-.06em] wrap-anywhere text-[var(--app-ink)] max-[580px]:text-[clamp(36px,10vw,49px)]">{property.title}<span className="text-[var(--app-accent)]">.</span></h1>
          <p className="m-0 text-[13px] leading-relaxed text-[var(--app-muted)]">A complete view of the listing and the details that matter.</p>
        </div>
        <div className="flex shrink-0 gap-2 pb-1 max-[760px]:mt-5 max-[580px]:w-full max-[580px]:[&>button:first-child]:flex-1">
          <Button variant="outline" onClick={() => setEditOpen(true)}><Pencil size={16} /> Edit property</Button>
          <Button variant="outline" className={archived ? "!w-11 !px-0 !text-rose-600 hover:!border-rose-500 hover:!bg-rose-50" : "!w-11 !px-0"} onClick={() => setActionOpen(true)} aria-label={archived ? "Delete property" : "Archive property"}>{archived ? <Trash2 size={16} /> : <Archive size={16} />}</Button>
        </div>
      </div>

      <section className="mb-6 grid min-h-[260px] grid-cols-[minmax(0,1.25fr)_minmax(270px,.75fr)] overflow-hidden rounded-xl border border-[#2e4978] bg-[#183364] text-white shadow-[0_14px_34px_#1834601c] max-[1100px]:grid-cols-[minmax(0,1fr)_minmax(250px,.8fr)] max-[760px]:grid-cols-1" aria-label="Property overview">
        <div className="relative isolate flex flex-col justify-between gap-8 overflow-hidden p-8 max-[760px]:min-h-[245px] max-[580px]:p-6">
          <div className="relative z-10 flex items-center justify-between gap-4"><span className="text-[10px] font-extrabold tracking-[.18em] text-[#a8c4f7]">THE PROPERTY BRIEF</span><span className={badgeClass}>{label(status)}</span></div>
          <div className="relative z-10"><span className="mb-1.5 block text-xs text-[#b3c8ea]">{label(property.propertyType)} for {label(property.transactionType).toLowerCase()}</span><h2 className="m-0 max-w-[600px] font-[family-name:var(--font-display)] text-[clamp(31px,3.1vw,49px)] leading-[1.08] font-bold tracking-[-.045em] max-[580px]:text-[30px]">{property.locality || property.municipality || property.district || "A new place"}<span className="text-[#9dbcf9]">, Nepal</span></h2></div>
          <div className="relative z-10 flex items-center gap-2 text-xs text-[#d4e2fc]"><MapPin size={17} /><span className="line-clamp-1">{location}</span></div>
          <Building2 className="pointer-events-none absolute -right-7 -bottom-12 size-56 rotate-[-8deg] text-white/[.06]" strokeWidth={.6} aria-hidden="true" />
        </div>
        <div className="relative flex flex-col items-start justify-center overflow-hidden border-l border-white/10 bg-gradient-to-br from-[#214781] to-[#142b57] p-9 max-[760px]:min-h-[158px] max-[760px]:border-t max-[760px]:border-l-0 max-[580px]:p-6">
          <span className="text-[10px] font-extrabold tracking-[.18em] text-[#a8c4f7]">ASKING PRICE</span>
          <strong className="relative z-10 my-5 font-[family-name:var(--font-display)] text-[clamp(26px,2.5vw,38px)] leading-[1.12] font-bold tracking-[-.045em] wrap-anywhere">{price}</strong>
          <small className="relative z-10 text-[11px] text-[#bdd1f2]">{label(property.transactionType)} listing · Nepalese rupees</small>
          <Home className="pointer-events-none absolute -right-9 -bottom-12 size-48 rotate-[-8deg] text-white/[.05]" strokeWidth={.6} aria-hidden="true" />
        </div>
      </section>

      <div className="grid grid-cols-[minmax(0,1.58fr)_minmax(270px,.72fr)] items-start gap-6 max-[1100px]:grid-cols-[minmax(0,1.2fr)_minmax(250px,.8fr)] max-[760px]:grid-cols-1">
        <div className="grid min-w-0 gap-5">
          <section className={cardClass}>
            <div className={panelHeadingClass}><div><span className={eyebrowClass}>01 / AT A GLANCE</span><h2 className={panelTitleClass}>Property specifications</h2></div><Ruler size={21} className="text-[var(--app-accent)]" strokeWidth={1.7} /></div>
            <div className="grid grid-cols-2 px-7 pb-2 max-[580px]:px-5 max-[480px]:grid-cols-1">
              <Fact icon={Home} name="Property type" value={label(property.propertyType)} />
              <Fact icon={Ruler} name="Land area" value={landArea} />
              <Fact icon={Building2} name="Built-up area" value={squareMeters(property.builtUpAreaSqMm) || "Not specified"} />
              <Fact icon={BedDouble} name="Bedrooms" value={hasValue(property.bedrooms) ? String(property.bedrooms) : "Not specified"} />
              <Fact icon={Bath} name="Bathrooms" value={hasValue(property.bathrooms) ? String(property.bathrooms) : "Not specified"} />
              <Fact icon={Route} name="Road access" value={hasValue(property.roadAccessMeters) ? `${property.roadAccessMeters} m` : "Not specified"} />
              <Fact icon={Compass} name="Facing" value={label(property.facing)} />
            </div>
          </section>

          <section className={cardClass}>
            <div className={panelHeadingClass}><div><span className={eyebrowClass}>02 / PLACE</span><h2 className={panelTitleClass}>Location</h2></div><MapPin size={21} className="text-[var(--app-accent)]" strokeWidth={1.7} /></div>
            <div className="grid grid-cols-2 gap-0 px-7 py-2 max-[580px]:px-5 max-[480px]:grid-cols-1">
              {[["Locality", property.locality], ["Municipality", property.municipality], ["District", property.district], ["Province", province]].map(([name, value]) => (
                <div className="border-b border-[var(--app-border)] py-4 even:pl-5 max-[480px]:even:pl-0" key={name}><small className="mb-1.5 block text-[10px] text-[var(--app-muted)]">{name}</small><strong className="text-xs font-bold text-[var(--app-ink)]">{value || "Not specified"}</strong></div>
              ))}
            </div>
          </section>

          <section className={cardClass}>
            <div className={panelHeadingClass}><div><span className={eyebrowClass}>03 / DESCRIPTION</span><h2 className={panelTitleClass}>About this property</h2></div></div>
            <p className="m-0 px-7 py-6 text-xs leading-[1.8] whitespace-pre-wrap wrap-anywhere text-[var(--app-muted)] max-[580px]:px-5">{property.description?.trim() || "No description has been added yet."}</p>
          </section>
          {property.remarks?.trim() && <section className={cardClass}><div className={panelHeadingClass}><div><span className={eyebrowClass}>04 / PRIVATE</span><h2 className={panelTitleClass}>Agent remarks</h2></div></div><p className="m-0 px-7 py-6 text-xs leading-[1.8] whitespace-pre-wrap wrap-anywhere text-[var(--app-muted)] max-[580px]:px-5">{property.remarks}</p></section>}
        </div>

        <aside className="grid min-w-0 gap-5 max-[760px]:grid-cols-2 max-[580px]:grid-cols-1" aria-label="Owner and record information">
          <section className={`${cardClass} p-6`}>
            <div className="flex items-center justify-between text-[var(--app-accent)]"><span className={eyebrowClass}>OWNER / SELLER</span><UserRound size={18} /></div>
            <div className="mt-6 grid size-[58px] place-items-center rounded-[14px] bg-[#e4edff] font-[family-name:var(--font-display)] text-[29px] font-bold text-[#2859b8]">{ownerName.charAt(0).toUpperCase()}</div>
            <h2 className="mt-4 mb-1 font-[family-name:var(--font-display)] text-2xl leading-tight font-bold tracking-[-.04em] wrap-anywhere">{ownerName}</h2>
            <p className="m-0 text-[11px] text-[var(--app-muted)]">{property.ownerClientId ? "Linked to a saved client" : "Owner on this listing"}</p>
            {(ownerPhone || ownerEmail) && <div className="mt-6 grid gap-2 border-t border-[var(--app-border)] pt-5">
              {ownerPhone && <a className="flex min-h-10 items-center gap-2.5 rounded-md border border-[var(--app-border)] px-3 py-2 text-[11px] font-semibold text-[var(--app-ink)] hover:border-[var(--app-accent)] hover:bg-[var(--app-soft)]" href={`tel:${ownerPhone}`}><Phone size={16} className="text-[var(--app-accent)]" /><span className="min-w-0 flex-1 wrap-anywhere">{ownerPhone}</span><ArrowUpRight size={14} className="text-[var(--app-muted)]" /></a>}
              {ownerEmail && <a className="flex min-h-10 items-center gap-2.5 rounded-md border border-[var(--app-border)] px-3 py-2 text-[11px] font-semibold text-[var(--app-ink)] hover:border-[var(--app-accent)] hover:bg-[var(--app-soft)]" href={`mailto:${ownerEmail}`}><Mail size={16} className="text-[var(--app-accent)]" /><span className="min-w-0 flex-1 wrap-anywhere">{ownerEmail}</span><ArrowUpRight size={14} className="text-[var(--app-muted)]" /></a>}
            </div>}
          </section>
          <section className={`${cardClass} p-6`}>
            <span className={eyebrowClass}>RECORD DETAILS</span>
            <dl className="mt-3 mb-0">
              <div className="flex min-h-[50px] items-center justify-between gap-3 border-b border-[var(--app-border)]"><dt className="text-[10px] text-[var(--app-muted)]">Status</dt><dd className="m-0"><span className={badgeClass}>{label(status)}</span></dd></div>
              <div className="flex min-h-[50px] items-center justify-between gap-3 border-b border-[var(--app-border)]"><dt className="text-[10px] text-[var(--app-muted)]">Reference</dt><dd className="m-0 text-right text-[10px] font-bold text-[var(--app-ink)]">{property.code || id.slice(0, 8).toUpperCase()}</dd></div>
              <div className="flex min-h-[50px] items-center justify-between gap-3 border-b border-[var(--app-border)]"><dt className="flex items-center gap-2 text-[10px] text-[var(--app-muted)]"><CalendarDays size={15} /> Created</dt><dd className="m-0 text-right text-[10px] font-bold text-[var(--app-ink)]">{formatBsDate(property.createdAt)}</dd></div>
              <div className="flex min-h-[50px] items-center justify-between gap-3"><dt className="flex items-center gap-2 text-[10px] text-[var(--app-muted)]"><CalendarDays size={15} /> Updated</dt><dd className="m-0 text-right text-[10px] font-bold text-[var(--app-ink)]">{formatBsDate(property.updatedAt)}</dd></div>
            </dl>
          </section>
        </aside>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent><div className="border-b border-[var(--app-border)] px-9 pt-8 pb-6 max-[580px]:px-5 max-[580px]:pt-6"><div className="text-[10px] font-extrabold tracking-[.18em] text-[var(--app-accent)]">EDIT RECORD</div><DialogTitle>Edit property</DialogTitle><DialogDescription>Update the listing details in your private workspace.</DialogDescription></div><RecordForm config={resources.properties} row={property} onSave={(payload) => save.mutate(payload)} saving={save.isPending} /></DialogContent>
      </Dialog>
      <DeleteDialog open={actionOpen} onOpenChange={setActionOpen} title={archived ? "Delete this property?" : "Archive this property?"} description={archived ? "This property will be permanently deleted. This action cannot be undone." : "This property will be moved to archived records. You can find it in Archived."} confirmationText={archived ? "yes" : undefined} confirmLabel={archived ? "Delete property" : "Archive property"} pending={archive.isPending || remove.isPending} onConfirm={() => archived ? remove.mutate() : archive.mutate()} />
    </div>
  );
}
