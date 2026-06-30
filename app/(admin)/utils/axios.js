const customAxios = async (urlOrConfig, config = {}) => {
  let url = '';
  let options = {};

  if (typeof urlOrConfig === 'string') {
    url = urlOrConfig;
    options = { ...config };
  } else if (urlOrConfig && typeof urlOrConfig === 'object') {
    url = urlOrConfig.url || '';
    options = { ...urlOrConfig };
  }

  const method = (options.method || 'GET').toUpperCase();
  const headers = { ...options.headers };

  if (!headers['Accept']) {
    headers['Accept'] = '*/*';
  }

  const fetchOptions = {
    method,
    headers,
  };

  if (options.data) {
    if (options.data instanceof FormData) {
      fetchOptions.body = options.data;
      // Do not manually set Content-Type for FormData as fetch will do it with the boundary
      delete headers['Content-Type'];
    } else {
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
      fetchOptions.body = typeof options.data === 'string' ? options.data : JSON.stringify(options.data);
    }
  }

  const res = await fetch(url, fetchOptions);
  
  let data = null;
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => null);
  } else {
    data = await res.text().catch(() => null);
  }

  const axiosResponse = {
    data,
    status: res.status,
    statusText: res.statusText,
    headers: res.headers,
    config: options,
    request: {}
  };

  if (!res.ok) {
    const error = new Error(`Request failed with status code ${res.status}`);
    error.response = axiosResponse;
    error.isAxiosError = true;
    throw error;
  }

  return axiosResponse;
};

customAxios.get = (url, config = {}) => customAxios(url, { ...config, method: 'GET' });
customAxios.delete = (url, config = {}) => customAxios(url, { ...config, method: 'DELETE' });
customAxios.post = (url, data, config = {}) => customAxios(url, { ...config, data, method: 'POST' });
customAxios.put = (url, data, config = {}) => customAxios(url, { ...config, data, method: 'PUT' });
customAxios.patch = (url, data, config = {}) => customAxios(url, { ...config, data, method: 'PATCH' });

export default customAxios;
