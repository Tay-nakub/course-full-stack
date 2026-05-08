'use client';

import { useState } from 'react';
import { FeedbackForm, type FeedbackInput } from '@/components/feedback-form';

export default function FeedbackPage() {
  const [submitted, setSubmitted] = useState<FeedbackInput | null>(null);

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold">ส่งความคิดเห็น</h1>
      {submitted ? (
        <div className="rounded border border-green-200 bg-green-50 p-4">
          <p className="font-semibold">ขอบคุณครับ {submitted.name}!</p>
          <p className="mt-2 text-sm text-gray-600">ข้อความ: {submitted.message}</p>
        </div>
      ) : (
        <FeedbackForm onSubmit={(data) => setSubmitted(data)} />
      )}
    </div>
  );
}
