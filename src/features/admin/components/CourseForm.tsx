import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Select } from '../../../shared/components/Select';
import type { CreateCourseDTO } from '../../../types';
import type { Department } from '../../../types/department.types';
import { useDepartments } from '../hooks/useAdmin';

const schema = z.object({
  departmentId: z.string().min(1, 'Please select an academic department'),
  code: z
    .string()
    .trim()
    .min(2, 'Course code is required (min 2 chars)')
    .max(12, 'Course code must be 12 characters or fewer')
    .regex(/^[A-Z0-9_\-]+$/, 'Code must be uppercase alphanumeric (e.g. CS101, MAT202)'),
  title: z.string().trim().min(3, 'Course title must be at least 3 characters'),
  description: z.string().trim().optional(),
});

type FormData = z.infer<typeof schema>;

export interface CourseFormProps {
  initialData?: Partial<FormData>;
  onSubmit: (data: CreateCourseDTO) => void;
  isSubmitting: boolean;
  onCancel: () => void;
  existingCodes?: string[];
}

export const CourseForm: React.FC<CourseFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
  existingCodes = [],
}) => {
  const { data: deptData } = useDepartments();
  const departments: Department[] = Array.isArray(deptData) ? deptData : [];

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initialData || { departmentId: '', code: '', title: '', description: '' },
  });

  React.useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({ departmentId: '', code: '', title: '', description: '' });
    }
  }, [initialData, reset]);

  const submitHandler = (data: FormData) => {
    // Check client-side code uniqueness if code changed or new
    const upperCode = data.code.toUpperCase().trim();
    const isNewOrChanged = !initialData?.code || initialData.code.toUpperCase() !== upperCode;
    if (isNewOrChanged && existingCodes.includes(upperCode)) {
      setError('code', { message: `Course code "${upperCode}" is already in use.` });
      return;
    }

    onSubmit({
      ...data,
      code: upperCode,
    });
  };

  const deptOptions = [
    { value: '', label: 'Select academic department...' },
    ...departments.map((d) => ({ value: d._id, label: d.name })),
  ];

  return (
    <form onSubmit={handleSubmit(submitHandler)} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Select
        label="Department"
        options={deptOptions}
        {...register('departmentId')}
        error={errors.departmentId?.message}
      />

      <Input
        label="Course Code"
        placeholder="e.g. CS101, MAT202"
        {...register('code')}
        onChange={(e) => {
          setValue('code', e.target.value.toUpperCase());
        }}
        error={errors.code?.message}
      />

      <Input
        label="Course Title"
        placeholder="e.g. Advanced Data Structures"
        {...register('title')}
        error={errors.title?.message}
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
          Curriculum Description (Optional)
        </label>
        <textarea
          rows={4}
          placeholder="Detailed syllabus outline and module objectives..."
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
          {initialData ? 'Save Changes' : 'Create Course'}
        </Button>
      </div>
    </form>
  );
};
