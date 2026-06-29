export default function instanceV1(token) {
  const baseURL = process.env.NEXT_PUBLIC_VITE_REACT_APP_BACKEND_URL || '';

  const request = async (url, options = {}) => {
    // Construct full URL
    const fullUrl = url.startsWith('http') ? url : `${baseURL}${url.startsWith('/') ? '' : '/'}${url}`;

    // Standard headers
    const headers = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };

    let body = options.body;

    // Handle Content-Type and body serialization
    // Check if Content-Type is multipart/form-data
    const contentTypeKey = Object.keys(headers).find(k => k.toLowerCase() === 'content-type');
    const isMultipart = contentTypeKey && headers[contentTypeKey].toLowerCase().includes('multipart/form-data');

    if (isMultipart) {
      // Remove Content-Type so browser sets the boundary automatically
      delete headers[contentTypeKey];
      
      // If body is a plain object, convert to FormData
      if (body && typeof body === 'object' && !(body instanceof FormData)) {
        const formData = new FormData();
        for (const key in body) {
          if (Object.prototype.hasOwnProperty.call(body, key)) {
            formData.append(key, body[key]);
          }
        }
        body = formData;
      }
    } else {
      // If it's a plain object (and not FormData), stringify to JSON
      if (body && typeof body === 'object' && !(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(body);
      }
    }

    const response = await fetch(fullUrl, {
      ...options,
      headers,
      body,
    });

    let data = null;
    const responseContentType = response.headers.get('content-type');
    if (responseContentType && responseContentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = await response.text();
    }

    const result = {
      status: response.status,
      data,
    };

    if (!response.ok) {
      const error = new Error(data?.msg || response.statusText || 'Request failed');
      error.response = result;
      throw error;
    }

    return result;
  };

  return {
    get: (url, config = {}) => request(url, { method: 'GET', ...config }),
    post: (url, data, config = {}) => request(url, { method: 'POST', body: data, ...config }),
    put: (url, data, config = {}) => request(url, { method: 'PUT', body: data, ...config }),
    delete: (url, config = {}) => request(url, { method: 'DELETE', ...config }),
  };
}
