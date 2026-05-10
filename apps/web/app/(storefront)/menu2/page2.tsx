'use client';

import { Input } from '@/components/ui/input';
import { error } from 'console';
import { User } from 'lucide-react';
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

const page2 = () => {

  const [text, setText] = useState('');
  const [count, setCount] = useState(0);
  
    const {
      register,
      handleSubmit,
      formState: { errors },
    } = useForm();

  const handleClickPlus = () =>{
    setCount(count + 1);
  }
  const handleClickMinus = () =>{
    setCount(count - 1);
  }

    const onSubmit = (data: any) => {
    setText(JSON.stringify(data));
    console.log('data', data);
  };

  console.log('errors', errors);
  return (
    <div>
 {/* input text */}
<form onSubmit={handleSubmit(onSubmit)}>
        Username
        <Input
          className="border bg-red-100 p-2"
          type="text"
          {...register('username', {
            required: 'Username is required',
            maxLength: { value: 8, message: 'Username cannot exceed 8 characters' },
          })}
        />
        {errors.username && (
          <p className="text-red-500">
            {typeof errors.username.message === 'string' ? errors.username.message : ''}
          </p>
        )}
        Password
        <Input className="border bg-red-100 p-2" type="text" {...register('password')} />
        <button
          className="mt-4 cursor-pointer rounded border bg-blue-100 px-3 py-1 hover:bg-blue-200"
          type="submit"
        >
          Submit
        </button>
      </form>

      <br></br>

<Input
        className="border p-2"
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <input
        className="border p-2"
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <p>You typed: {text}</p>

      {/* button +1 */}
      <button
        className="cursor-pointer rounded border bg-green-100 px-3 py-1 hover:bg-green-200"
        // onClick={() => setCount(count + 10)}
        //or ใช้ function
        onClick={handleClickPlus}
      >
        +1
      </button>
      <p>Count: {count}</p>

       {/* button -1 */}
      <button
        className="cursor-pointer rounded border bg-red-100 px-3 py-1 hover:bg-red-200"
        onClick={handleClickMinus}
      >
        -1
      </button>
      
    </div>
  );
};

export default page2;