'use client';

import { Input } from '@/components/ui/input';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

const Menu2 = () => {
  const [text, setText] = useState('');
  const [count, setCount] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const handleClickPlus = () => {
    setCount(count + 1);
  };

  const handleClickMinus = () => {
    setCount(count - 1);
  };

  const onSubmit = (data: any) => {
    setText(JSON.stringify(data));
    console.log('data', data);
  };

  console.log('errors', errors);

  return (
    <div>
      <form onSubmit={handleSubmit(onSubmit)}>
        Username
        <Input
          className="border bg-red-100 p-2"
          type="text"
          {...register('username', {
            required: 'Username is required',
            maxLength: { value: 8, message: 'Username cannot exceed 8 characters' },
            validate: (value) => {
              if (value === 'admin') {
                return 'Username cannot be admin';
              }
              return true;
            },
          })}
        />
        {errors.username && (
          <p className="text-red-500">
            {typeof errors.username.message === 'string' ? errors.username.message : ''}
          </p>
        )}
        Password
        <Input className="border bg-red-100 p-2" type="text" {...register('password')} />
        {errors.password && (
          <p className="text-red-500">
            {typeof errors.password.message === 'string' ? errors.password.message : ''}
          </p>
        )}
        <button
          className="mt-4 cursor-pointer rounded border bg-blue-100 px-3 py-1 hover:bg-blue-200"
          type="submit"
        >
          Submit
        </button>
      </form>
      <p>You typed: {text}</p>
    </div>
  );
};

export default Menu2;