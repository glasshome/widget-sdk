/**
 * Widget Form Hook
 *
 * Wraps @modular-forms/solid with zodForm validation for widget configuration forms.
 * This is the SolidJS equivalent of the React useWidgetForm that used react-hook-form.
 *
 * @example
 * ```tsx
 * import { z } from "zod";
 *
 * const schema = z.object({
 *   title: z.string().optional(),
 *   entityIds: z.array(z.string()).min(1),
 *   showIcon: z.boolean(),
 * });
 *
 * type FormValues = z.infer<typeof schema>;
 *
 * function MyWidgetSettings() {
 *   const { form, Form, Field, isDirty, handleSubmit } = useWidgetForm<FormValues>({
 *     schema,
 *     initialValues: {
 *       title: config.title ?? "",
 *       entityIds: config.entityIds ?? [],
 *       showIcon: true,
 *     },
 *     onSubmit: async (values) => {
 *       await saveConfig(values);
 *     },
 *   });
 *
 *   return (
 *     <Form onSubmit={handleSubmit}>
 *       <Field name="title">
 *         {(field, props) => (
 *           <input {...props} value={field.value} />
 *         )}
 *       </Field>
 *     </Form>
 *   );
 * }
 * ```
 */

import {
  createForm,
  type FieldValues,
  type FormStore,
  getValue,
  type PartialValues,
  reset,
  type SubmitHandler,
  setValue,
  zodForm,
} from "@modular-forms/solid";
import { createMemo } from "solid-js";
import type { z } from "zod";

export interface UseWidgetFormOptions<TValues extends FieldValues> {
  /** Zod schema for form validation */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  schema: z.ZodType<TValues, any, any>;
  /** Initial form values */
  initialValues: TValues;
  /** Submit handler */
  onSubmit?: (values: TValues) => void | Promise<void>;
}

export interface UseWidgetFormReturn<TValues extends FieldValues> {
  /** The form store */
  form: FormStore<TValues, undefined>;
  /** Whether form has unsaved changes */
  isDirty: () => boolean;
  /** Whether form is currently submitting */
  isSubmitting: () => boolean;
  /** Handle form submission */
  handleSubmit: SubmitHandler<TValues>;
  /** Get a field value */
  getValue: typeof getValue;
  /** Set a field value */
  setValue: typeof setValue;
  /** Reset form to initial values */
  reset: typeof reset;
}

/**
 * Hook for widget configuration forms using @modular-forms/solid
 *
 * Callers use the returned form store with `<Form>` and `<Field>` components
 * imported directly from @modular-forms/solid.
 *
 * @param options - Form configuration with schema, initial values, and submit handler
 * @returns Form store, derived state, and utility functions
 */
export function useWidgetForm<TValues extends FieldValues>(
  options: UseWidgetFormOptions<TValues>,
): UseWidgetFormReturn<TValues> {
  const [form] = createForm<TValues, undefined>({
    validate: zodForm(options.schema),
    initialValues: options.initialValues as PartialValues<TValues>,
  });

  const isDirty = createMemo(() => form.dirty);
  const isSubmitting = createMemo(() => form.submitting);

  const handleSubmit: SubmitHandler<TValues> = (values) => {
    options.onSubmit?.(values);
  };

  return {
    form,
    isDirty,
    isSubmitting,
    handleSubmit,
    getValue,
    setValue,
    reset,
  };
}
