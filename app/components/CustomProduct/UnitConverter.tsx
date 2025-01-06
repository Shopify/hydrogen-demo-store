import {useState} from 'react';
const convertUnits = (value: number, fromUnit: string, toUnit: string): number => {
  if (fromUnit === 'mm' && toUnit === 'inch') return value / 25.4;
  if (fromUnit === 'inch' && toUnit === 'mm') return value * 25.4;
  if (fromUnit === 'm' && toUnit === 'yard') return value * 1.09361;
  if (fromUnit === 'yard' && toUnit === 'm') return value / 1.09361;
  return value;
};
const formatNumber = (num: number): string => {
  return Number(num.toFixed(3)).toString();
};
interface UnitConverterProps {
  unitOne: string;
  unitTwo: string;
  maxValue: number;
  minValue: number;
  nameOne: string;
  nameTwo: string;
  onError: (hasError: boolean) => void;
  onValueChange?: (value: number) => void;
}
export function UnitConverter({
  unitOne,
  unitTwo,
  maxValue,
  minValue,
  nameOne, 
  nameTwo,
  onError,
  onValueChange
}: UnitConverterProps) {
  const [valueOne, setValueOne] = useState<string>("1");
  const [valueTwo, setValueTwo] = useState<string>(
    formatNumber(convertUnits(1, unitOne, unitTwo))
  );
  const [hasError, setHasError] = useState<boolean>(false);
  const checkError = (value: number): boolean => {
    const isError = value < minValue || value > maxValue;
    return isError;
  }
  const handleValueOneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValueOne(value);
  };
  const handleValueTwoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValueTwo(value);
  };
  const handleValueOneBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let value = e.target.value;
      
    if (value === '') {
      setValueOne(minValue.toString());
      setValueTwo(formatNumber(convertUnits(minValue, unitOne, unitTwo)));
      setHasError(false);
      onError(false);
      onValueChange?.(minValue);
      return;
    }
  
    if (value.startsWith('.')) {
      value = `0${value}`;
    }
  
    const numValue = parseFloat(value);
    const hasError = checkError(numValue);
    setHasError(hasError);
    onError(hasError);
  
    setValueOne(formatNumber(numValue));
    const converted = convertUnits(numValue, unitOne, unitTwo);
    setValueTwo(formatNumber(converted));
    if (!hasError && onValueChange) {
      onValueChange(numValue);
    }
  };
  const handleValueTwoBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let value = e.target.value;
      
    if (value === '') {
      const convertedMin = convertUnits(minValue, unitOne, unitTwo);
      setValueTwo(formatNumber(convertedMin));
      setValueOne(minValue.toString());
      setHasError(false);
      onError(false);
      onValueChange?.(minValue);
      return;
    }
  
    if (value.startsWith('.')) {
      value = `0${value}`;
    }
  
    const numValue = parseFloat(value);
    const convertedToOne = convertUnits(numValue, unitTwo, unitOne);
    const hasError = checkError(convertedToOne);
    setHasError(hasError);
    onError(hasError);
  
    setValueTwo(formatNumber(numValue));
    setValueOne(formatNumber(convertedToOne));
    if (!hasError && onValueChange) {
      onValueChange(convertedToOne);
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <input
              type="number"
              name={nameOne}
              value={valueOne}
              onChange={handleValueOneChange}
              onBlur={handleValueOneBlur}
              className="w-full min-w-0 px-2 py-2 border rounded"
              placeholder={`${unitOne}`}
              min={minValue}
              step="any"
            />
            <span className="text-gray-600 shrink-0">{unitOne}</span>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <input
              type="number"
              name={nameTwo}
              value={valueTwo}
              onChange={handleValueTwoChange}
              onBlur={handleValueTwoBlur}
              className="w-full min-w-0 px-2 py-2 border rounded"
              placeholder={`${unitTwo}`}
              min={0}
              step="any"
            />
            <span className="text-gray-600 shrink-0">{unitTwo}</span>
          </div>
        </div>
      </div>
      {hasError && (
        <p className="text-red-500 text-sm mt-2">
          Min: {minValue} {unitOne}&nbsp;&nbsp;&nbsp;Max: {maxValue} {unitOne}.
          <br />
          Please enter between {minValue} {unitOne} - {maxValue} {unitOne} or for sizes above {maxValue} {unitOne}, please contact our {' '}
          <a 
            href="/contact" 
            target="_BLANK"
            className="text-blue-600 underline"
          >
            sales team
          </a>
        </p>
      )}
    </div>
  );
}