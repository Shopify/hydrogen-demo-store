import React, {type FC, useEffect, useState} from 'react';
import {MinusIcon, PlusIcon} from '@heroicons/react/24/solid';
export interface CustomInputNumberProps {
  className?: string;
  defaultValue?: number;
  min?: number;
  max?: number;
  onChange?: (value: number) => void;
  label?: string;
  desc?: string;
  name?: string;  // 新增
}
const CustomInputNumber: FC<CustomInputNumberProps> = ({
  className = 'w-full',
  defaultValue = 1, 
  min = 1,
  max = 10000,
  onChange,
  label,
  desc,
  name,  // 新增name prop
}) => {
  const [value, setValue] = useState(defaultValue);
  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);
  const handleClickDecrement = () => {
    if (min >= value) return;
    setValue((state) => {
      return state - 1;
    });
    onChange && onChange(value - 1);
  };
  const handleClickIncrement = () => {
    if (max && max <= value) return;
    setValue((state) => {
      return state + 1; 
    });
    onChange && onChange(value + 1);
  };
  const renderLabel = () => {
    return (
      <div className="flex flex-col">
        <span className="font-medium text-neutral-800 dark:text-neutral-200">
          {label}
        </span>
        {desc && (
          <span className="text-xs text-neutral-500 dark:text-neutral-400 font-normal">
            {desc}
          </span>
        )}
      </div>
    );
  };
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseInt(e.target.value);
    
    // 如果是正整数且不超过最大值
    if (newValue > 0 && (!max || newValue <= max)) {
      setValue(newValue);
      onChange && onChange(newValue);
    }
  };
  
  return (
    <div
      className={`custom-input-number flex items-center justify-between gap-5 ${className}`}
    >
      {label && renderLabel()}
      <div className="custom-input-number__content flex items-center justify-between gap-3 w-[7.5rem] sm:w-32">
        <button
          className="w-8 h-8 rounded flex items-center justify-center border border-brand bg-brand text-white hover:bg-brand focus:outline-none disabled:opacity-50 disabled:cursor-default"
          type="button"
          onClick={handleClickDecrement}
          disabled={min >= value}
        >
          <MinusIcon className="w-6" />
        </button>
        <input
          type="number"
          name={name}
          value={value}
          onChange={handleInputChange}
          className="w-24 text-center focus:outline-none" 
          min={min}
          max={max}
        />
        <button
          className="w-8 h-8 rounded flex items-center justify-center border border-brand bg-brand text-white hover:bg-brand focus:outline-none disabled:opacity-50 disabled:cursor-default"          
          type="button"
          onClick={handleClickIncrement}
          disabled={max ? max <= value : false}
        >
          <PlusIcon className="w-6" />
        </button>
      </div>
    </div>
  );
};
export default CustomInputNumber;