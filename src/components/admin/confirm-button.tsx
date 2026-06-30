'use client';

// Botón de envío con confirmación, usable dentro de un <form> existente mediante
// formAction (no anida formularios). La action es un Server Action.
export function ConfirmButton({
  action,
  label,
  confirmText,
  className,
}: {
  action: (formData: FormData) => void | Promise<void>;
  label: string;
  confirmText: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      formAction={action}
      className={className}
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {label}
    </button>
  );
}
