"use client";

import { useRef, useState } from "react";
import infoNepal from "info-nepal";
import { Plus, Trash2 } from "lucide-react";
import { provinceNamesByNumber, provinceNumber } from "./config";
import { parsePreferredLocations, type PreferredLocation } from "./preferred-locations";

type DraftLocation = PreferredLocation & { key: number; localityText: string };

export function PreferredLocationsInput({
  id,
  value,
  onChange,
  onBlur,
  invalid,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  invalid: boolean;
}) {
  const [locations, setLocations] = useState<DraftLocation[]>(() =>
    parsePreferredLocations(value).map((location, key) => ({
      ...location,
      key,
      localityText: location.localities.join(", "),
    })),
  );
  const nextKey = useRef(locations.length);

  function commit(next: DraftLocation[]) {
    setLocations(next);
    onChange(JSON.stringify(next.map(({ province, district, municipality, localityText }) => ({
      province,
      district,
      municipality,
      localities: localityText.split(",").map((name) => name.trim()).filter(Boolean),
    }))));
  }

  function change(index: number, patch: Partial<DraftLocation>) {
    commit(locations.map((location, position) => position === index ? { ...location, ...patch } : location));
  }

  return (
    <div className="preferred-locations">
      {locations.map((location, index) => {
        const districts = infoNepal.districtsOfProvince[provinceNumber(location.province) ?? ""] ?? [];
        const municipalities = infoNepal.localBodies[location.district] ??
          infoNepal.localBodies[location.district.replaceAll(" ", "")] ?? [];
        return (
          <div className="preferred-location" key={location.key}>
            <div className="preferred-location-heading">
              <strong>Preferred area {index + 1}</strong>
              <button type="button" className="preferred-location-remove" onClick={() => commit(locations.filter((_, position) => position !== index))} aria-label={`Remove preferred area ${index + 1}`}>
                <Trash2 size={15} /> Remove
              </button>
            </div>
            <div className="preferred-location-grid">
              <label>
                Province
                <select className="field-input" value={location.province} onBlur={onBlur} onChange={(event) => change(index, { province: event.target.value, district: "", municipality: "" })} aria-invalid={invalid}>
                  <option value="">Choose province</option>
                  {Object.values(provinceNamesByNumber).map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </label>
              <label>
                District
                <select className="field-input" value={location.district} onBlur={onBlur} onChange={(event) => change(index, { district: event.target.value, municipality: "" })} disabled={!location.province} aria-invalid={invalid}>
                  <option value="">Choose district</option>
                  {location.district && !districts.includes(location.district) && <option value={location.district}>{location.district}</option>}
                  {districts.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </label>
              <label>
                Municipality / metropolitan city
                <select className="field-input" value={location.municipality} onBlur={onBlur} onChange={(event) => change(index, { municipality: event.target.value })} disabled={!location.district} aria-invalid={invalid}>
                  <option value="">Choose municipality</option>
                  {location.municipality && !municipalities.includes(location.municipality) && <option value={location.municipality}>{location.municipality}</option>}
                  {municipalities.map((name) => <option key={name} value={name}>{name}</option>)}
                </select>
              </label>
              <label>
                Localities
                <input className="field-input" value={location.localityText} onBlur={onBlur} onChange={(event) => change(index, { localityText: event.target.value })} maxLength={2020} placeholder="e.g. Baneshwor, Maitidevi" aria-invalid={invalid} />
              </label>
            </div>
            <span className="field-hint">Separate localities with commas. Leave empty for the whole municipality.</span>
          </div>
        );
      })}
      <button id={id} type="button" className="preferred-location-add" aria-label="Add preferred area" onClick={() => commit([...locations, { key: nextKey.current++, province: "", district: "", municipality: "", localities: [], localityText: "" }])} disabled={locations.length >= 20}>
        <Plus size={16} /> Add preferred area
      </button>
    </div>
  );
}
