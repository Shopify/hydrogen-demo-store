// routes/api.create-variant.ts
import {json} from '@shopify/remix-oxygen';
import type {ActionFunction} from '@shopify/remix-oxygen';
import {calculatePriceAndWeight, type CalculationProps} from '~/utils/calculations';
import {createAdminApiClient} from '@shopify/admin-api-client';

// 提取变体创建逻辑为纯函数
async function createVariant(adminClient: any, {productId, price, weight}: {
  productId: string;
  price: string;
  weight: number;
}) {
  // 生成唯一变体名
  const variantName = `${Date.now().toString(36)}${Math.random().toString(36).slice(-2)}`;
  
  const variables = {
    productId,
    variants: [{
      price,
      optionValues: [{optionName: "Title", name: variantName}],
      inventoryQuantities: {
        availableQuantity: 1000,
        locationId: "gid://shopify/Location/79990817057"
      },
      inventoryItem: {
        measurement: {
          weight: {
            value: weight,
            unit: "KILOGRAMS"
          }
        }
      }
    }]
  };

  const {data, errors} = await adminClient.request(CREATE_VARIANT_MUTATION, {
    variables
  });

  if (errors || data?.productVariantsBulkCreate?.userErrors?.length > 0) {
    throw new Error('Failed to create variant');
  }

  return data.productVariantsBulkCreate.productVariants[0].id;
}


export const action: ActionFunction = async ({request, context}) => {
  try {
    const formData = await request.formData();

    const calculationProps: CalculationProps = {
      formType: formData.get('formType') as string,
      thickness: formData.get('thickness') as string,
      diameter: formData.get('diameter') as string,
      density: parseFloat(formData.get('density') as string),
      lengthM: parseFloat(formData.get('lengthM') as string),
      lengthMm: parseFloat(formData.get('lengthMm') as string),
      widthMm: parseFloat(formData.get('widthMm') as string),
      precision: formData.get('precision') as string,
      quantity: parseInt(formData.get('quantity') as string),
      unitPrice: parseFloat(formData.get('unitPrice') as string)
    };
    const {price, weight} = calculatePriceAndWeight(calculationProps);

    const adminClient = createAdminApiClient({
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
      apiVersion: context.env.SHOPIFY_ADMIN_API_VERSION, 
      accessToken: context.env.SHOPIFY_ADMIN_ACCESS_TOKEN,
    });
    const newVariantId = await createVariant(adminClient, {
      productId: formData.get('productId') as string,
      price,
      weight
    });


    try {
      const lineAttributes = [];
      // 根据formType添加thickness或diameter
      if (calculationProps.formType === 'Sheet' || calculationProps.formType === 'Film') {
        lineAttributes.push({
          key: 'Thickness',
          value: `${calculationProps.thickness}`
        });
      } else if (calculationProps.formType === 'Rod') {
        lineAttributes.push({
          key: 'Diameter',
          value: `${calculationProps.diameter}`
        });
      }
      // 根据formType添加长度显示
      if (calculationProps.formType === 'Film') {
        const lengthM = formData.get('lengthM');
        const lengthYard = formData.get('lengthYard');
        lineAttributes.push({
          key: 'Length',
          value: `${lengthM}m (${lengthYard}yard)`
        });
      } else {
        const lengthMm = formData.get('lengthMm');
        const lengthInch = formData.get('lengthInch');
        lineAttributes.push({
          key: 'Length',
          value: `${lengthMm}mm (${lengthInch}")`
        });
      }
      // 添加宽度（同时显示mm和inch）
      if (calculationProps.widthMm) {
        const widthInch = formData.get('widthInch');
        lineAttributes.push({
          key: 'Width',
          value: `${calculationProps.widthMm}mm (${widthInch}")`
        });
      }
      // 添加精度
      if (calculationProps.precision) {
        lineAttributes.push({
          key: 'Precision',
          value: calculationProps.precision
        });
      }
      // 添加说明信息
      const instructions = formData.get('instructions');
      if (instructions) {
        lineAttributes.push({
          key: 'Instructions',
          value: instructions as string
        });
      }
      const lineData = {
        merchandiseId: newVariantId,
        quantity: parseInt(formData.get('quantity') as string) || 1,
        attributes: lineAttributes
      };
      
      const cartResult = await context.cart.addLines([lineData])
        .catch(error => {
          throw error;
        });
        
      const headers = context.cart.setCartId(cartResult.cart.id);
      return json(
        {
          status: 'success',
          //variantCreation: data,
          cartOperation: cartResult
        },
        {
          headers
        }
      );
    } catch (cartError) {
      throw new Error(`Cart operation failed: ${cartError instanceof Error ? cartError.message : 'Unknown error'}`);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return json(
        {
          status: 'error',
          error: error.message,
          timestamp: new Date().toISOString(),
        },
        {status: 500}
      );
    }
    return json(
      {
        status: 'error',
        error: 'An unknown error occurred',
        timestamp: new Date().toISOString(),
      },
      {status: 500}
    );
  }
};

const CREATE_VARIANT_MUTATION = `
  mutation productVariantsBulkCreate($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
    productVariantsBulkCreate(productId: $productId, variants: $variants) {
      userErrors {
        field
        message
      }
      productVariants {
        id
        title
        selectedOptions {
          name
          value
        }
      }
    }
  }
`;
