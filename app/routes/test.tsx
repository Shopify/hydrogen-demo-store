import {useEffect, useRef, useState} from 'react';
import {createStorefrontApiClient} from '@shopify/storefront-api-client';
import type {LoaderFunctionArgs} from '@remix-run/server-runtime';
import {useLoaderData} from '@remix-run/react';

export async function loader({context}: LoaderFunctionArgs) {
  return {
    storeDomain: context.env.PUBLIC_STORE_DOMAIN,
    publicAccessToken: context.env.PUBLIC_STOREFRONT_API_TOKEN,
  };
}

export default function MakeRequests() {
  const [direct, setDirect] = useState({time: null});
  const [oxygen, setOxygen] = useState({time: null});
  const requestMade = useRef(false);

  const data = useLoaderData<typeof loader>();

  useEffect(() => {
    if (!requestMade.current) {
      performance.measure('oxygen');
      fetch('/resource')
        .then((resp) => resp.json())
        .then(() => {
          setOxygen(performance.measure('oxygen'));
        });

      const client = createStorefrontApiClient({
        storeDomain: data.storeDomain,
        apiVersion: '2023-10',
        publicAccessToken: data.publicAccessToken,
      });

      performance.measure('direct');

      client
        .request(
          `{
        shop {
          name
        }
      }
      `,
        )
        .then(({data, errors, extensions}) => {
          const result = performance.measure('direct');
          setDirect(result);
        });
      requestMade.current = true;
    }
  }, []);

  return (
    <div>
      <h1>Performance metrics for the following query:</h1>
      <pre
        dangerouslySetInnerHTML={{
          __html: `{
  shop {
    name
  }
}`,
        }}
      ></pre>
      <br />
      <h2>Oxygen timing</h2>
      <p>Making a request to oxygen, then a sub-request to the SFAPI</p>
      <p>{oxygen.duration}</p>
      <br />
      <h2>SFAPI Direct timing</h2>
      <p>Making a request directly from the browser to the SFAPI</p>
      <p>{direct.duration}</p>
    </div>
  );
}
