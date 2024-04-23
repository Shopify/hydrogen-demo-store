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
  const [oxygenCache, setOxygenCache] = useState({time: null});
  const [refresh, setRefresh] = useState(false);
  const requestMade = useRef(false);

  const data = useLoaderData<typeof loader>();

  useEffect(() => {
    const oxygenTime = performance.now();
    fetch('/resource')
      .then((resp) => resp.json())
      .then((resp) => {
        setOxygen({
          duration: performance.now() - oxygenTime,
          serverTime: resp.time,
        });
      });

    const oxygenCacheTime = performance.now();
    fetch('/resource-cached')
      .then((resp) => resp.json())
      .then((resp) => {
        debugger;
        setOxygenCache({
          duration: performance.now() - oxygenCacheTime,
          serverTime: resp.time,
        });
      });

    const client = createStorefrontApiClient({
      storeDomain: data.storeDomain,
      apiVersion: '2023-10',
      publicAccessToken: data.publicAccessToken,
    });

    const directTime = performance.now();

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
        setDirect({
          duration: performance.now() - directTime,
        });
      });
    requestMade.current = true;
  }, [refresh]);

  return (
    <div style={{marginLeft: 20}}>
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
      <table>
        <tr>
          <td>Time to make a request from the browser to oxygen to SFAPI</td>
          <td>
            <b>{oxygen.duration}</b>
          </td>
        </tr>
        <tr>
          <td>Time to make a request from oxygen to the SFAPI</td>
          <td>
            <b>{oxygen.serverTime}</b>
          </td>
        </tr>
        <tr>
          <td>
            Time to make a request from the browser to Oxygen with cached
            request to SFAPI
          </td>
          <td>
            <b>{oxygenCache.duration}</b>
          </td>
        </tr>
        <tr>
          <td>Time to query the cloudflare caches API</td>
          <td>
            <b>{oxygenCache.serverTime}</b>
          </td>
        </tr>
      </table>
      <br />
      <button
        className="text-blue-800"
        style={{fontWeight: 'bold'}}
        onClick={() => setRefresh(!refresh)}
      >
        Refresh
      </button>
    </div>
  );
}
