'use client';

import { Input } from '@/components/ui/input';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

const Menu2 = () => {
  const [text, setText] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data: any) => {
    setText(JSON.stringify(data));
    console.log('data', data);
  };

  return (
    <div className="flex min-h-[calc(100vh-11rem)] items-center justify-center bg-white p-6">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-md space-y-6 rounded-3xl bg-slate-50 p-6 py-8 shadow-sm ring-1 ring-slate-200/80"
      >
        <div className="space-y-3 ml-6">
          <label className="block mt-5 text-sm font-medium text-slate-700" style={{ marginTop: '20px', marginLeft: '10px' }}>Username</label>
          <Input
            className="w-full px-6 rounded border border-slate-200 bg-white p-2"
            type="text"
            {...register('username', {
              required: 'Username is required',
              maxLength: {
                value: 8,
                message: 'Username cannot exceed 8 characters',
              },
              validate: (value) => {
                if (value === 'admin') {
                  return 'Username cannot be admin';
                }
                return true;
              },
            })}
          />
          {errors.username && (
            <p className="text-sm text-red-500">
              {typeof errors.username.message === 'string'
                ? errors.username.message
                : ''}
            </p>
          )}
        </div>

        <br></br>

        <div className="space-y-3 ml-6">
          <label className="block text-sm font-medium text-slate-700" style={{ marginTop: '20px', marginLeft: '10px' }}>Password</label>
          <Input
            className="w-full px-6 rounded border border-slate-200 bg-white p-2"
            type="text"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-sm text-red-500">
              {typeof errors.password.message === 'string' ? errors.password.message : ''}
            </p>
          )}
        </div>

        <button
          className="w-full rounded bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          type="submit"
        >
          Submit
        </button>

        <p className="mt-4 text-sm text-slate-600">You typed: {text}</p>
      </form>
    </div>
  );
};

export default Menu2;