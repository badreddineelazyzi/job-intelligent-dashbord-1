import { useState, useEffect } from 'react';

export const useApi = (apiFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const response = await apiFunction();
        setData(response.data);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.detail || err.message);
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, isLoading, error };
};
