import combineUrl from './combine-url';
import getSettings from './settings';

function removeTrailingSlash(url) {
  if (!url || !url.endsWith('/')) {
    return url;
  }
  return url.substring(0, url.length - 1);
}

const cookies = (document.cookie || '')
  .split(';')
  .map((o) => o.trim())
  .map((o) => {
    const [key, value] = o.split('=');
    return { key, value };
  });

const [tokenCookie] = cookies.filter((c) => /^bearer$/i.test(c.key));
const token = tokenCookie ? tokenCookie.value : undefined;

const AUTH_HEADERS = {

  ...(token
    ? { Authorization: `Bearer ${token}` }
    : {}),
};

export { combineUrl };
export default function apiCall(uri, query = {}, method = 'GET', body = undefined, options = {}) {
  return new Promise((resolve, reject) => {
    getSettings()
      .then((settings) => {
        const {
          absoluteUrl = false,
          headers = {},
          isBlob = false,
          credentials = true,
        } = options;
        const extraHeaders = settings.useBearerAuth ? AUTH_HEADERS : {};
        try {
          const parsedQuery = Object.entries(typeof query === 'object' ? query : {})
            .filter(([, value]) => !!value)
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`);
          const queryString = parsedQuery.length > 0 ? `?${parsedQuery.join('&')}` : '';
          fetch(
            absoluteUrl
              ? `${uri}${queryString}`
              : combineUrl(settings.api, `/${uri}${queryString}`),
            {
              mode: CPAPI ? 'cors' : undefined,
              credentials: CPAPI && credentials ? 'include' : undefined,
              body: body ? JSON.stringify(body) : undefined,
              method: method || (body ? 'POST' : 'GET'),
              headers: {
                'Content-Type': 'application/json',
                ...headers,
                ...extraHeaders,
              },
            },
          )
            .then((response) => {
              const codeFamily = Math.ceil(response.status / 100);
              if (codeFamily === 4 || codeFamily === 5) {
                if (response.status === 401 && settings.redirectOnAPIUnauthenticated) {
                  const authEndpoint = combineUrl(
                    settings.api,
                    `/route?url=${removeTrailingSlash(document.location.href)}/&type=COOKIE`,
                  );
                  console.log(`"${uri}" got 401 error. Redirecting to ${authEndpoint}`);
                  window.location = authEndpoint;
                }
                reject(new Error(`Response: ${response.status} ${response.statusText}`));
              } else if (isBlob) {
                response
                  .blob()
                  .then(resolve)
                  .catch(reject);
              } else {
                response
                  .json()
                  .then(resolve)
                  .catch(reject);
              }
            })
            .catch(reject);
        } catch (e) {
          reject(e);
        }
      })
      .catch(reject);
  });
}
