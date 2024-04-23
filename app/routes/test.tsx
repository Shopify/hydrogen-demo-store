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
  const [direct, setDirect] = useState([]);
  const [oxygen, setOxygen] = useState([]);
  const [oxygenCache, setOxygenCache] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const requestMade = useRef(false);

  const data = useLoaderData<typeof loader>();

  useEffect(() => {
    const oxygenTime = performance.now();
    fetch('/resource')
      .then((resp) => resp.json())
      .then((resp) => {
        setOxygen([
          ...oxygen,
          {
            duration: performance.now() - oxygenTime,
            serverTime: resp.time,
          },
        ]);
      });

    const oxygenCacheTime = performance.now();
    fetch('/resource-cached')
      .then((resp) => resp.json())
      .then((resp) => {
        setOxygenCache([
          ...oxygenCache,
          {
            duration: performance.now() - oxygenCacheTime,
            serverTime: resp.time,
          },
        ]);
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
        setDirect([
          ...direct,
          {
            duration: performance.now() - directTime,
          },
        ]);
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
          <td></td>
          <td>Time (ms)</td>
          <td>Aggregate time (ms)</td>
        </tr>
        <tr>
          <td>Time to make a request from the browser to oxygen to SFAPI</td>
          <td>
            <b>{oxygen[oxygen.length - 1]?.duration}</b>
          </td>
          <td>
            <b>
              {oxygen.reduce((acc, val) => val.duration + acc, 0) /
                direct.length}
            </b>
          </td>
        </tr>
        <tr>
          <td>Time to make a request from oxygen to the SFAPI</td>
          <td>
            <b>{oxygen[oxygen.length - 1]?.serverTime}</b>
          </td>
          <td>
            <b>
              {oxygen.reduce((acc, val) => val.serverTime + acc, 0) /
                direct.length}
            </b>
          </td>
        </tr>
        <tr>
          <td>
            Time to make a request from the browser to Oxygen with cached
            request to SFAPI
          </td>
          <td>
            <b>{oxygenCache[oxygenCache.length - 1]?.duration}</b>
          </td>
          <td>
            <b>
              {oxygenCache.reduce((acc, val) => val.duration + acc, 0) /
                direct.length}
            </b>
          </td>
        </tr>
        <tr>
          <td>Time to query the cloudflare caches API</td>
          <td>
            <b>{oxygenCache[oxygenCache.length - 1]?.serverTime}</b>
          </td>
          <td>
            <b>
              {oxygenCache.reduce((acc, val) => val.serverTime + acc, 0) /
                direct.length}
            </b>
          </td>
        </tr>
        <tr>
          <td>Time to query the SFAPI directly from the browser</td>
          <td>
            <b>{direct[direct.length - 1]?.duration}</b>
          </td>
          <td>
            <b>
              {direct.reduce((acc, val) => val.duration + acc, 0) /
                direct.length}
            </b>
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
