import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FeedbackForm } from '@/components/feedback-form';

describe('FeedbackForm', () => {
  it('แสดง error เมื่อ submit ทั้งที่ name ว่าง', async () => {
    const user = userEvent.setup();
    render(<FeedbackForm onSubmit={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /ส่ง/i }));

    expect(await screen.findByText(/ต้องกรอกชื่อ/i)).toBeInTheDocument();
  });

  it('แสดง error เมื่อ message สั้นกว่า 10 ตัวอักษร', async () => {
    const user = userEvent.setup();
    render(<FeedbackForm onSubmit={vi.fn()} />);

    await user.type(screen.getByLabelText(/ชื่อ/i), 'สมชาย');
    await user.type(screen.getByLabelText(/ข้อความ/i), 'สั้น');
    await user.click(screen.getByRole('button', { name: /ส่ง/i }));

    expect(await screen.findByText(/อย่างน้อย 10 ตัวอักษร/i)).toBeInTheDocument();
  });

  it('เรียก onSubmit ด้วยข้อมูลที่ valid', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(<FeedbackForm onSubmit={handleSubmit} />);

    await user.type(screen.getByLabelText(/ชื่อ/i), 'สมชาย');
    await user.type(screen.getByLabelText(/ข้อความ/i), 'กาแฟอร่อยมากครับ ขอบคุณครับ');
    await user.click(screen.getByRole('button', { name: /ส่ง/i }));

    await vi.waitFor(() => {
      expect(handleSubmit).toHaveBeenCalledWith({
        name: 'สมชาย',
        message: 'กาแฟอร่อยมากครับ ขอบคุณครับ',
      });
    });
  });
});
