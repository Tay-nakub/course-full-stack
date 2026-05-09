'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const FeedbackSchema = z.object({
  name: z.string().min(1, 'ต้องกรอกชื่อ'),
  message: z.string().min(10, 'ข้อความต้องอย่างน้อย 10 ตัวอักษร'),
});

export type FeedbackInput = z.infer<typeof FeedbackSchema>;

interface FeedbackFormProps {
  onSubmit: (data: FeedbackInput) => void;
}

export function FeedbackForm({ onSubmit }: FeedbackFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FeedbackInput>({
    resolver: zodResolver(FeedbackSchema),
  });

  return (
    <form onSubmit={handleSubmit((data) => onSubmit(data))} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="name">ชื่อ</Label>
        <Input id="name" {...register('name')} />
        {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="message">ข้อความ</Label>
        <textarea
          id="message"
          rows={4}
          className="border-input bg-background flex w-full rounded-md border px-3 py-2 text-sm"
          {...register('message')}
        />
        {errors.message && <p className="text-destructive text-sm">{errors.message.message}</p>}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        ส่ง
      </Button>
    </form>
  );
}
