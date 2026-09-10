import axios from "axios";

// Set config defaults when creating the instance
const instance = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

// Alter defaults after instance has been created
//   instance.defaults.headers.common['Authorization'] = AUTH_TOKEN;

// Add a request interceptor
instance.interceptors.request.use(
  function (config) {
    // Do something before the request is sent
    config.headers.Authorization = `Bearer ${localStorage.getItem(
      "access_token"
    )}`;
    return config;
  },
  function (error) {
    // Do something with the request error
    return Promise.reject(error);
  }
);

// Add a response interceptor
instance.interceptors.response.use(
  (response) => {
    // Any status code that lies within the range of 2xx causes this function to trigger
    return response;
  },
  async (error) => {
    // Any status codes that fall outside the range of 2xx cause this function to trigger
    // Do something with response error

    const originalRequest = error.config;
    //refresh access_token if it expires
    if (
      error.response?.data?.status === 401 &&
      !originalRequest._retry &&
      error.response?.data?.message?.toLowerCase()?.includes("token")
    ) {
      originalRequest._retry = true;
      try {
        const res = await instance.post(
          `auth/refresh`,
          {},
          { withCredentials: true }
        );

        const newAccessToken = res.data.accessToken;
        localStorage.setItem("access_token", newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return instance(originalRequest);
      } catch (refreshError) {
        console.log(refreshError);
        localStorage.removeItem("access_token");
        // window.location.href = "/auth";
        return Promise.reject(refreshError);
      }
    }

    const backendError = error.response?.data || {
      message: "An unexpected error occurred",
      status: error.response?.status || 500,
      code: "UNKNOWN_ERROR",
    };
    return Promise.reject(backendError);
  }
);

export default instance;
