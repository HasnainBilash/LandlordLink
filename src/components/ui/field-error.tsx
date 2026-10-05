type FieldErrorProps = {
  errors?: string[];
};

// The first validation error for one input.
export function FieldError({ errors }: FieldErrorProps) {
  if (!errors?.length) return null;

  return <p className="text-sm text-destructive">{errors[0]}</p>;
}

type FormErrorProps = {
  message: string | null;
};

// A form-level error that isn't tied to one input.
export function FormError({ message }: FormErrorProps) {
  if (!message) return null;

  return (
    <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
      {message}
    </p>
  );
}
