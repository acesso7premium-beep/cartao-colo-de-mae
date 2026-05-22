import type { Field } from "./types";

interface Props {
  field: Field;
  value: any;
  onChange: (value: any) => void;
}

export function FieldRenderer({ field, value, onChange }: Props) {
  const baseInput =
    "w-full rounded-2xl border-2 border-border bg-card px-5 py-4 text-lg text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors";

  if (field.type === "textarea") {
    return (
      <div className="space-y-2">
        <label htmlFor={field.id} className="block text-lg font-semibold">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </label>
        <textarea
          id={field.id}
          rows={5}
          className={baseInput}
          placeholder={field.placeholder}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  if (field.type === "radio" && field.options) {
    return (
      <fieldset className="space-y-3">
        <legend className="text-lg font-semibold mb-2">
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {field.options.map((opt) => {
            const selected = value === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onChange(opt.value)}
                aria-pressed={selected}
                className={`flex items-center gap-3 rounded-2xl border-2 px-5 py-4 text-left text-lg transition-all min-h-14 ${
                  selected
                    ? "border-primary bg-accent shadow-soft scale-[1.01]"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                {opt.emoji && <span className="text-2xl">{opt.emoji}</span>}
                <span className="font-medium">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
    );
  }

  if (field.type === "checkbox" && field.options) {
    const arr: string[] = Array.isArray(value) ? value : [];
    const toggle = (v: string) =>
      onChange(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
    return (
      <fieldset className="space-y-3">
        <legend className="text-lg font-semibold mb-2">{field.label}</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {field.options.map((opt) => {
            const selected = arr.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggle(opt.value)}
                aria-pressed={selected}
                className={`flex items-center gap-3 rounded-2xl border-2 px-5 py-4 text-left text-lg transition-all min-h-14 ${
                  selected
                    ? "border-primary bg-accent shadow-soft"
                    : "border-border bg-card hover:border-primary/50"
                }`}
              >
                <span
                  aria-hidden
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-base ${
                    selected ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
                  }`}
                >
                  {selected ? "✓" : ""}
                </span>
                {opt.emoji && <span className="text-2xl">{opt.emoji}</span>}
                <span className="font-medium">{opt.label}</span>
              </button>
            );
          })}
        </div>
      </fieldset>
    );
  }

  if (field.type === "consent") {
    const checked = !!value;
    return (
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
        className={`flex w-full items-start gap-4 rounded-2xl border-2 p-5 text-left transition-all ${
          checked ? "border-primary bg-accent" : "border-border bg-card hover:border-primary/50"
        }`}
      >
        <span
          aria-hidden
          className={`mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 text-base ${
            checked ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background"
          }`}
        >
          {checked ? "✓" : ""}
        </span>
        <span className="text-base leading-relaxed">{field.label}</span>
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor={field.id} className="block text-lg font-semibold">
        {field.label}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </label>
      <input
        id={field.id}
        type={field.type}
        className={baseInput}
        placeholder={field.placeholder}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
    </div>
  );
}