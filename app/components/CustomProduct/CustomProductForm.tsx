import type {ProductQuery} from 'storefrontapi.generated';
import {useEffect, useState} from 'react';
import {useFetcher, useNavigate, useNavigation} from '@remix-run/react';
import {UnitConverter} from '~/components/CustomProduct/UnitConverter';
import CustomInputNumber from '~/components/CustomProduct/CustomInputNumber';
import {PriceDisplay} from '~/components/CustomProduct/PriceDisplay';
import {CustomVariantSelector, type CustomVariantOption} from '~/components/CustomProduct/CustomVariantSelector';
import clsx from 'clsx';
import {Button} from '~/components/Button';
import {HubspotForm} from '~/components/HubspotForm';

interface ApiResponse {
  status: 'success' | 'error';
  error?: string;
  variantCreation?: any;
  cartOperation?: any;
  timestamp?: string;
}
interface CustomProductFormProps {
  product: ProductQuery['product'];
  facets: any;
  productMetafields: any;
}
export function CustomProductForm({product, facets, productMetafields}: CustomProductFormProps) {
  if (!product?.id) {
    throw new Response('product', {status: 404});
  }
  
  const fetcher = useFetcher<ApiResponse>();

  const collection = product.collections.nodes[0];
  
  const formType = product.form_type?.value || '';
  const machiningPrecision = product.machining_precision?.value || 'Normal (±2mm)';
  
  const [hasError, setHasError] = useState(false);
  const [lengthMm, setLengthMm] = useState(1);
  const [lengthM, setLengthM] = useState(1);
  const [widthMm, setWidthMm] = useState(formType === 'Film' ? 450 : 1);
  const [quantity, setQuantity] = useState(1);
  const [precision, setPrecision] = useState(machiningPrecision);
  useEffect(() => {
    if (fetcher.data?.status === 'success') {
        console.error('添加成功');
    } else if (fetcher.data?.error) {
      console.error('添加失败:', fetcher.data.error);
    }
  }, [fetcher.data]);
  const handlePrecisionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPrecision(e.target.value);
  };

  const CustomProductOption = ({option}: {option: CustomVariantOption}) => {
    const navigate = useNavigate();
    const navigation = useNavigation();
    // 判断是否正在导航中
    const isNavigating = navigation.state !== 'idle';
    
    if (!option.values.length) {
      return null;
    }
  
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedValue = option.values.find(v => v.value === e.target.value);
      if(!selectedValue) return;
      
      selectedValue.onSelect();
      if(selectedValue.to) {
        navigate(selectedValue.to);
      }
    };
  
    return (
      <div className="mb-4 max-w-xl">
        <label htmlFor={option.name} className="block font-medium text-sm mb-2">
          {option.name}
        </label>
        <select
          id={option.name}
          value={option.value || ''}
          onChange={handleChange}
          disabled={isNavigating}
          className={clsx(
            "w-full rounded-md border-gray-200 py-2 px-3 text-sm",
            isNavigating && "opacity-50 cursor-not-allowed"
          )}
        >
          <option value="" disabled>
            Select {option.name}
          </option>
          {option.values.map(({value, isAvailable, isActive}) => (
            <option 
              key={option.name + value}
              value={value}
              disabled={!isAvailable}
            >
              {value}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto">
      <PriceDisplay 
              formType={formType}
              thickness={product.thickness?.value || ''}
              diameter={product.diameter?.value || ''}
              density={Number(product.density?.value) || 0}
              lengthMm={lengthMm}
              lengthM={lengthM}
              widthMm={widthMm}
              precision={precision}
              quantity={quantity}
              unitPrice={Number(product.unit_price?.value) || 0}
        />
        <CustomVariantSelector
        handle={product.handle}
        options={facets}
        variants={productMetafields}
      >
        {({option}) => (
          <CustomProductOption option={option} />
        )}
      </CustomVariantSelector>
      <fetcher.Form action="/api/custom-add-to-cart" method="post">
        <input type="hidden" name="productId" value={product.id || ''} />
        <input type="hidden" name="formType" value={formType} />
        <input type="hidden" name="material" value={product.material?.value || ''} />
        <input type="hidden" name="opacity" value={product.opacity?.value || ''} />
        <input type="hidden" name="color" value={product.color?.value || ''} />
        <input type="hidden" name="thickness" value={product.thickness?.value || ''} />
        <input type="hidden" name="diameter" value={product.diameter?.value || ''} />
        <input type="hidden" name="density" value={product.density?.value || ''} />
        <input type="hidden" name="unitPrice" value={product.unit_price?.value || ''} />
        <div className="mt-6 mb-6">
          <div className="space-y-6 max-w-xl">
            {formType === 'Film' ? (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Width</label>
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                    {[450, 1370].map((width) => (
                      <div key={width} className="flex items-center">
                        <input
                          type="radio"
                          id={`width${width}`}
                          name="widthMm"
                          value={width}
                          checked={widthMm === width}
                          onChange={(e) => setWidthMm(Number(e.target.value))}
                          className="h-4 w-4 border-gray-300 text-blue-600"
                        />
                        <label htmlFor={`width${width}`} className="ml-2 text-sm text-gray-700">
                          {width}mm
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Length</label>
                  <UnitConverter 
                    unitOne="m"
                    unitTwo="yard"
                    maxValue={100}
                    minValue={1}
                    nameOne="lengthM"
                    nameTwo="lengthYard"
                    onError={setHasError}
                    onValueChange={setLengthM}
                  />
                </div>
              </>
            ) : formType === 'Rod' ? (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">Length</label>
                <UnitConverter 
                  unitOne="mm"
                  unitTwo="inch"
                  maxValue={1000}
                  minValue={1}
                  nameOne="lengthMm"
                  nameTwo="lengthInch"
                  onError={setHasError}
                  onValueChange={setLengthMm}
                />
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Length</label>
                  <UnitConverter 
                    unitOne="mm"
                    unitTwo="inch"
                    maxValue={600}
                    minValue={1}
                    nameOne="lengthMm"
                    nameTwo="lengthInch"
                    onError={setHasError}
                    onValueChange={setLengthMm}
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">Width</label>
                  <UnitConverter 
                    unitOne="mm"
                    unitTwo="inch"
                    maxValue={600}
                    minValue={1}
                    nameOne="widthMm"
                    nameTwo="widthInch"
                    onError={setHasError}
                    onValueChange={setWidthMm}
                  />
                </div>
              </>
            )}
            {formType !== 'Film' && (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Machining Precision
                </label>
                <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                  {[
                    { id: 'Normal', value: 'Normal (±2mm)' },
                    { id: 'High', value: 'High (±0.2mm)' }
                  ].map((item) => (
                    <div key={item.id} className="flex items-center">
                      <input
                        type="radio"
                        id={item.id}
                        name="precision" 
                        value={item.value}
                        checked={precision === item.value}
                        onChange={handlePrecisionChange}
                        disabled={
                          item.id === 'High' && machiningPrecision === 'Normal (±2mm)'
                        }
                        className="h-4 w-4 border-gray-300 text-brand"
                      />
                      <label htmlFor={item.id} className="ml-2 text-sm text-gray-700">
                        {item.value}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Additional Instructions
              </label>
              <textarea
                name="instructions"
                rows={4}
                className="w-full max-w-xl rounded-md border-gray-300 shadow-sm"
                placeholder="Please enter any additional instructions here..."
              />
            </div>
            <div className="flex flex-col gap-4">
              {/* 数量选择 */}
              <div className="flex items-center gap-4">
                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                  Quantity
                </span>
                <CustomInputNumber
                  name="quantity" 
                  defaultValue={1}
                  min={1}
                  max={10000}
                  onChange={(value) => setQuantity(value)}
                />
              </div>
              {/* 加购按钮 - 注意保留flex-1和h-full */}
              <div className="grid items-stretch gap-4">
                <Button
                  type="submit"
                  disabled={fetcher.state !== 'idle' || hasError}
                >
                  <span>
                    {fetcher.state !== 'idle' ? 'Adding...' : 'Add to Cart'}
                  </span>
                </Button>
              </div>
              <div className="grid mt-4">
                <HubspotForm buttonText="获取报价" />
              </div>
            </div>
          </div>
        </div>
      </fetcher.Form>
    </div>
  );
}