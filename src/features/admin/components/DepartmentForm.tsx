import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import type { CreateDepartmentDTO } from '../../../types';

const schema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  description: z.string().trim().optional(),
});

type FormData = z.infer<typeof schema>;

export interface DepartmentFormProps {
  initialData?: Partial<FormData>;
  onSubmit: (data: CreateDepartmentDTO) => void;
  isSubmitting: boolean;
  onCancel: () => void;
}

export const DepartmentForm: React.FC<DepartmentFormProps> = ({ initialData, onSubmit, isSubmitting, onCancel }) => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData || { name: '', description: '' },
  });

  React.useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({ name: '', description: '' });
    }
  }, [initialData, reset]);

  const submitHandler = (data: FormData) => {
    onSubmit(data as unknown as CreateDepartmentDTO);
  };

  return (
    <form onSubmit={handleSubmit(submitHandler)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Input
        label="Department Name"
        placeholder="e.g. Computer Science"
        {...register('name')}
        error={errors.name?.message}
      />
      <div>
        <label
          style={{
            display: 'block',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--color-text)',
            marginBottom: '6px',
          }}
        >
          Description (Optional)
        </label>
        <textarea
          rows={4}
          placeholder="Brief overview of curriculum and academic focus..."
          {...register('description')}
          style={{
            width: '100%',
            padding: '10px 14px',
            fontSize: '0.875rem',
            lineHeight: 1.5,
            borderRadius: '8px',
            border: errors.description?.message ? '1px solid var(--color-danger)' : '1px solid var(--color-border)',
            backgroundColor: 'var(--color-surface)',
            color: 'var(--color-text)',
            fontFamily: 'inherit',
            resize: 'vertical',
            outline: 'none',
            boxSizing: 'border-box',
          }}
        />
        {errors.description?.message && (
          <span style={{ fontSize: '0.75rem', color: 'var(--color-danger)', marginTop: '4px', display: 'block' }}>
            {errors.description.message}
          </span>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          alignItems: 'center',
          marginTop: '12px',
          paddingTop: '20px',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <Button variant="ghost" type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" isLoading={isSubmitting}>
          {initialData ? 'Save Changes' : 'Create Department'}
        </Button>
      </div>
    </form>
  );
};

