import * as React from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { Select } from '../../../shared/components/Select';
import type { CreateTopicDTO } from '../../../types';
import type { Course } from '../../../types/course.types';
import type { Topic } from '../../../types/topic.types';

const schema = z.object({
  name: z.string().trim().min(2, 'Topic name must be at least 2 characters'),
  courseId: z.string().min(1, 'Please select a course'),
  order: z
    .number()
    .int('Order must be an integer')
    .min(1, 'Order must be 1 or greater')
    .optional(),
});

type FormData = z.infer<typeof schema>;

export interface TopicFormProps {
  courses: Course[];
  existingTopics?: Topic[];
  initialData?: Partial<FormData> & { _id?: string };
  onSubmit: (data: CreateTopicDTO) => void;
  isSubmitting: boolean;
  onCancel: () => void;
  defaultCourseId?: string;
}

export const TopicForm: React.FC<TopicFormProps> = ({
  courses,
  existingTopics = [],
  initialData,
  onSubmit,
  isSubmitting,
  onCancel,
  defaultCourseId = '',
}) => {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    control,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || '',
      courseId: initialData?.courseId || defaultCourseId || '',
      order: initialData?.order ?? 1,
    },
  });

  const selectedCourseId = useWatch({ control, name: 'courseId' });

  React.useEffect(() => {
    if (initialData) {
      reset({
        name: initialData.name || '',
        courseId: initialData.courseId || '',
        order: initialData.order ?? 1,
      });
    } else {
      // Suggest next order for the default course if available
      const courseTopics = existingTopics.filter((t) => {
        const cId =
          typeof t.courseId === 'string'
            ? t.courseId
            : (t.courseId as unknown as { _id: string })?._id;
        return cId === (defaultCourseId || courses[0]?._id);
      });
      const maxOrder = courseTopics.reduce((max, t) => Math.max(max, t.order || 0), 0);

      reset({
        name: '',
        courseId: defaultCourseId || (courses[0]?._id ?? ''),
        order: maxOrder + 1,
      });
    }
  }, [initialData, defaultCourseId, courses, reset]);

  // When course changes in create mode, auto-suggest next order number
  React.useEffect(() => {
    if (!initialData && selectedCourseId) {
      const courseTopics = existingTopics.filter((t) => {
        const cId =
          typeof t.courseId === 'string'
            ? t.courseId
            : (t.courseId as unknown as { _id: string })?._id;
        return cId === selectedCourseId;
      });
      const maxOrder = courseTopics.reduce((max, t) => Math.max(max, t.order || 0), 0);
      setValue('order', maxOrder + 1);
    }
  }, [selectedCourseId, initialData, existingTopics, setValue]);

  const submitHandler = (data: FormData) => {
    const targetOrder = data.order ?? 1;

    // Validate that order is unique per course
    const conflict = existingTopics.find((t) => {
      const cId =
        typeof t.courseId === 'string'
          ? t.courseId
          : (t.courseId as unknown as { _id: string })?._id;
      const isSameCourse = cId === data.courseId;
      const isSameOrder = t.order === targetOrder;
      const isSelf = initialData?._id && t._id === initialData._id;
      return isSameCourse && isSameOrder && !isSelf;
    });

    if (conflict) {
      setError('order', {
        message: `Order #${targetOrder} is already assigned to topic "${conflict.name}" in this course.`,
      });
      return;
    }

    onSubmit({
      name: data.name,
      courseId: data.courseId,
      order: targetOrder,
    });
  };

  const courseOptions = [
    { value: '', label: 'Select course...' },
    ...courses.map((course) => ({
      value: course._id,
      label: `[${course.code}] ${course.title}`,
    })),
  ];

  return (
    <form onSubmit={handleSubmit(submitHandler)} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-20)' }}>
      <Select
        label="Course Assignment"
        options={courseOptions}
        {...register('courseId')}
        error={errors.courseId?.message}
      />

      <Input
        label="Topic Name"
        placeholder="e.g. Asymptotic Analysis & Big O Notation"
        {...register('name')}
        error={errors.name?.message}
      />

      <Input
        label="Module Sequence Order"
        type="number"
        min={1}
        placeholder="e.g. 1"
        {...register('order', { valueAsNumber: true })}
        error={errors.order?.message}
      />

      <div
        style={{
          display: 'flex',
          gap: 'var(--space-12)',
          justifyContent: 'flex-end',
          marginTop: 'var(--space-16)',
          paddingTop: 'var(--space-16)',
          borderTop: '1px solid var(--color-border)',
        }}
      >
        <Button variant="ghost" type="button" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button variant="primary" type="submit" isLoading={isSubmitting}>
          {initialData ? 'Save Changes' : 'Create Topic'}
        </Button>
      </div>
    </form>
  );
};
