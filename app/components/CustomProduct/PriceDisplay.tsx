import {useEffect} from 'react';
import {
  calculatePriceAndWeight, 
  type CalculationProps, 
} from '~/utils/calculations';
/**
 * PriceDisplay组件 - 用于显示产品的价格和重量
 */
export function PriceDisplay(props: CalculationProps) {
  const {quantity} = props;
  
  // 计算当前价格和重量
  const result = calculatePriceAndWeight(props);
  const totalPrice = (Number(result.price) * quantity).toFixed(2);
  
  return (
    <div className="mb-4 space-y-1">
      <div className="text-lg font-medium text-gray-900">
        Price: ${totalPrice}
      </div>
    </div>
  );
}
// 重新导出类型，以便其他组件可以使用这些类型
//export type {CalculationProps, PriceWeightResult};