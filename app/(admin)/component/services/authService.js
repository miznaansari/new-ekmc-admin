const baseUrl = process.env.NEXT_PUBLIC_VITE_REACT_APP_BACKEND_URL;

const request = async (url, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  let body = options.body;
  if (body && typeof body === 'object') {
    body = JSON.stringify(body);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    body,
  });

  let data = null;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
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

const login = async (credentials) => {
  return request(`${baseUrl}/api/v2/admin/login-password`, {
    method: 'POST',
    body: credentials,
  });
};

const generateOTP = async (mobileNumber, user_role_id) => {
  return request(`${baseUrl}/api/v2/admin/gen-otp`, {
    method: 'POST',
    body: { mobile_number: mobileNumber, user_role_id: user_role_id },
  });
};

const verifyOTP = async (data) => {
  return request(`${baseUrl}/api/v2/admin/verify-otp`, {
    method: 'POST',
    body: data,
  });
};

const resetPassword = async (data) => {
  return request(`${baseUrl}/api/v2/admin/reset-password`, {
    method: 'PUT',
    body: data,
  });
};

const authService = {
  login,
  generateOTP,
  verifyOTP,
  resetPassword,
};

export default authService;
