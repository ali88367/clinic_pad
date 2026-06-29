"use client";

import * as React from "react";
import { v4 as uuid } from "uuid";
import { Star } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { searchDrugs, getFavouriteDrugs } from "@/lib/firestore-service";
import type { Drug, DrugUsage, PrescriptionItem } from "@/lib/types";

const FREQUENCY_OPTIONS = [
  { label: "Subah Shaam", value: "Subah Shaam (BD)" },
  { label: "Din mein 3 baar", value: "Din mein 3 baar (TDS)" },
  { label: "Raat ko", value: "Sirf raat ko (HS)" },
  { label: "Subah", value: "Sirf subah (OD)" },
  { label: "Zaroorat par", value: "Zaroorat par (SOS)" },
];

const DURATION_OPTIONS = [
  { label: "3 din", value: "3 din" },
  { label: "5 din", value: "5 din" },
  { label: "7 din", value: "7 din" },
  { label: "10 din", value: "10 din" },
  { label: "14 din", value: "14 din" },
  { label: "1 mahina", value: "1 mahina" },
];

const INSTRUCTION_OPTIONS = [
  { label: "Khana khane ke baad", value: "Khana khane ke baad" },
  { label: "Khana khane se pehle", value: "Khana khane se pehle" },
  { label: "Khaali pait", value: "Khaali pait" },
  { label: "Doodh ke saath", value: "Doodh ke saath" },
  { label: "Pani zyada piyein", value: "Pani zyada piyein" },
];

function ChipGroup({
  options,
  value,
  onSelect,
}: {
  options: { label: string; value: string }[];
  value: string;
  onSelect: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onSelect(opt.value)}
          className={`rounded-full border px-2.5 py-1 text-[12px] transition-colors ${
            value === opt.value
              ? "border-petrol bg-petrol-light font-medium text-petrol-dark"
              : "border-border text-ink-muted hover:border-petrol/40"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

interface DrugPickerSheetProps {
  trigger: React.ReactNode;
  editing?: PrescriptionItem;
  onSave: (item: PrescriptionItem) => void;
}

export function DrugPickerSheet({ trigger, editing, onSave }: DrugPickerSheetProps) {
  const { user } = useAuth();
  const [open, setOpen] = React.useState(false);
  const [drugName, setDrugName] = React.useState(editing?.drugName ?? "");
  const [dosage, setDosage] = React.useState(editing?.dosage ?? "");
  const [frequency, setFrequency] = React.useState(editing?.frequency ?? "");
  const [duration, setDuration] = React.useState(editing?.duration ?? "");
  const [quantity, setQuantity] = React.useState(editing?.quantity ?? "");
  const [instructions, setInstructions] = React.useState(editing?.instructions ?? "");
  const [suggestions, setSuggestions] = React.useState<Drug[]>([]);
  const [favourites, setFavourites] = React.useState<DrugUsage[]>([]);

  const handleOpenChange = (o: boolean) => {
    setOpen(o);
    setSuggestions([]);
    if (o) {
      setDrugName(editing?.drugName ?? "");
      setDosage(editing?.dosage ?? "");
      setFrequency(editing?.frequency ?? "");
      setDuration(editing?.duration ?? "");
      setQuantity(editing?.quantity ?? "");
      setInstructions(editing?.instructions ?? "");
      if (user) {
        getFavouriteDrugs(user.uid).then(setFavourites);
      }
    }
  };

  const onNameChange = async (value: string) => {
    setDrugName(value);
    if (value.trim().length < 1) {
      setSuggestions([]);
      return;
    }
    const results = await searchDrugs(value);
    setSuggestions(results.slice(0, 6));
  };

  const pick = (d: Drug) => {
    setDrugName(d.brandName);
    if (!dosage) setDosage(d.commonDosage);
    if (!frequency) setFrequency(d.commonFrequency);
    setSuggestions([]);
  };

  const pickFavourite = (f: DrugUsage) => {
    setDrugName(f.drugName);
    if (!dosage) setDosage(f.dosage);
    if (!frequency) setFrequency(f.frequency);
  };

  const save = () => {
    if (!drugName.trim()) return;
    onSave({
      id: editing?.id ?? uuid(),
      drugName: drugName.trim(),
      dosage: dosage.trim(),
      frequency: frequency.trim(),
      duration: duration.trim(),
      quantity: quantity.trim(),
      instructions: instructions.trim(),
    });
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent>
        <SheetTitle>{editing ? "Dawa edit karein" : "Dawa shamil karein"}</SheetTitle>
        <div className="space-y-4">
          {!editing && favourites.length > 0 && !drugName && (
            <div>
              <Label className="flex items-center gap-1.5">
                <Star className="size-3.5 text-gold" />
                Aksar likhi jane wali
              </Label>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {favourites.map((f) => (
                  <button
                    key={f.drugName}
                    type="button"
                    onClick={() => pickFavourite(f)}
                    className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-[12px] text-ink hover:border-gold/60"
                  >
                    {f.drugName} {f.dosage}
                  </button>
                ))}
              </div>
            </div>
          )}
          <div className="relative">
            <Label htmlFor="drug-name">Dawa ka naam</Label>
            <Input
              id="drug-name"
              value={drugName}
              onChange={(e) => onNameChange(e.target.value)}
              autoFocus
              autoComplete="off"
            />
            {suggestions.length > 0 && (
              <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-md border border-border bg-surface shadow-lg">
                {suggestions.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => pick(d)}
                    className="flex w-full flex-col items-start px-3.5 py-2 text-left hover:bg-petrol-light"
                  >
                    <span className="text-[14px] font-medium text-ink">{d.brandName}</span>
                    <span className="text-[12px] text-ink-muted">{d.genericName}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="dosage">Miqdar (Dosage)</Label>
            <Input id="dosage" placeholder="500mg" value={dosage} onChange={(e) => setDosage(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="frequency">Kab leni hai</Label>
            <ChipGroup options={FREQUENCY_OPTIONS} value={frequency} onSelect={setFrequency} />
            <Input
              id="frequency"
              className="mt-2"
              placeholder="Ya yahan likhein..."
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="duration">Kitne din tak</Label>
            <ChipGroup options={DURATION_OPTIONS} value={duration} onSelect={setDuration} />
            <Input
              id="duration"
              className="mt-2"
              placeholder="Ya yahan likhein..."
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="quantity">Miqdar / Qty</Label>
            <Input
              id="quantity"
              placeholder="30 tablets, 1 bottle"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="instructions">Hidayat</Label>
            <ChipGroup options={INSTRUCTION_OPTIONS} value={instructions} onSelect={setInstructions} />
            <Input
              id="instructions"
              className="mt-2"
              placeholder="Ya yahan likhein..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>
          <Button className="w-full" size="lg" onClick={save} disabled={!drugName.trim()}>
            Mehfooz karein
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
