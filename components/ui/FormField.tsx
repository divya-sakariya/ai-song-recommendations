import type { InputHTMLAttributes } from "react";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  hint?: string;
}

// Every field: a programmatically associated <label>, and errors tied via
// aria-describedby rather than shown as disconnected floating text
// (Design_Spec.md #3, Engineering_Backlog.md ACCESS-04/05).
export function FormField({ label, id, error, hint, className = "", ...props }: FormFieldProps) {
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
    .filter(Boolean)
    .join(" ") || undefined;

  return (
    <div className="field mt-6 first:mt-0">
      <label htmlFor={id} className="block text-small font-semibold mb-2 text-text-soft">
        {label}
      </label>
      <input
        id={id}
        className={`w-full bg-panel-2 border rounded px-3.5 py-3 text-body text-text ${
          error ? "border-red-400" : "border-line"
        } ${className}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...props}
      />
      {hint && (
        <p id={`${id}-hint`} className="text-small text-text-soft mt-1">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-small text-red-400 mt-1 flex items-center gap-1">
          <span aria-hidden="true">⚠</span> {error}
        </p>
      )}
    </div>
  );
}
