import { useForm, UseFormProps, UseFormReturn, FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

/**
 * Custom hook for forms with Zod validation
 * 
 * Provides type-safe form handling with automatic validation using Zod schemas.
 * Supports real-time validation with debouncing.
 * 
 * @param schema - Zod schema for validation
 * @param options - Additional react-hook-form options
 * @returns UseFormReturn with typed methods
 * 
 * @example
 * ```tsx
 * const form = useValidatedForm(surveillantSchema, {
 *   defaultValues: { nom: '', prenom: '' }
 * });
 * 
 * <form onSubmit={form.handleSubmit(onSubmit)}>
 *   <input {...form.register('nom')} />
 *   {form.formState.errors.nom && <span>{form.formState.errors.nom.message}</span>}
 * </form>
 * ```
 */
export function useValidatedForm<TSchema extends z.ZodType<any, any, any>>(
  schema: TSchema,
  options?: Omit<UseFormProps<z.infer<TSchema>>, 'resolver'>
): UseFormReturn<z.infer<TSchema>> {
  return useForm<z.infer<TSchema>>({
    resolver: zodResolver(schema),
    mode: 'onChange', // Validate on change for real-time feedback
    ...options,
  });
}

/**
 * Hook variant with onBlur validation mode (less aggressive)
 */
export function useValidatedFormOnBlur<TSchema extends z.ZodType<any, any, any>>(
  schema: TSchema,
  options?: Omit<UseFormProps<z.infer<TSchema>>, 'resolver'>
): UseFormReturn<z.infer<TSchema>> {
  return useForm<z.infer<TSchema>>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    ...options,
  });
}

/**
 * Hook variant with onSubmit validation mode (least aggressive)
 */
export function useValidatedFormOnSubmit<TSchema extends z.ZodType<any, any, any>>(
  schema: TSchema,
  options?: Omit<UseFormProps<z.infer<TSchema>>, 'resolver'>
): UseFormReturn<z.infer<TSchema>> {
  return useForm<z.infer<TSchema>>({
    resolver: zodResolver(schema),
    mode: 'onSubmit',
    reValidateMode: 'onChange', // After first submit, validate on change
    ...options,
  });
}
