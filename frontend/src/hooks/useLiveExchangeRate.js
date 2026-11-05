import { useState, useEffect } from 'react';
import axios from 'axios';

export function useLiveExchangeRate() {
  const [rates, setRates] = useState({
    USD: 1.0,
    INR: 86.85,
    EUR: 0.92,
    SGD: 1.34,
  });
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    axios.get('https://open.er-api.com/v6/latest/USD', { timeout: 5000 })
      .then(res => {
        if (isMounted && res.data && res.data.rates) {
          setRates({
            USD: 1.0,
            INR: Number((res.data.rates.INR || 86.85).toFixed(2)),
            EUR: Number((res.data.rates.EUR || 0.92).toFixed(2)),
            SGD: Number((res.data.rates.SGD || 1.34).toFixed(2)),
          });
          setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }
      })
      .catch(err => {
        if (isMounted) {
          console.warn("Live FX rate fetch failed, using fallback exchange rates:", err);
          setError("Network fallback active");
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const currentRate = rates[selectedCurrency] || 1.0;

  const formatCurrency = (usdValue, curr = selectedCurrency) => {
    const rate = rates[curr] || 1.0;
    const converted = (usdValue || 0) * rate;

    const symbolMap = {
      USD: '$',
      INR: '₹',
      EUR: '€',
      SGD: 'S$'
    };

    const symbol = symbolMap[curr] || '$';

    if (curr === 'INR') {
      return `${symbol}${Math.round(converted).toLocaleString('en-IN')}`;
    }
    return `${symbol}${Math.round(converted).toLocaleString()}`;
  };

  return {
    selectedCurrency,
    setSelectedCurrency,
    rates,
    currentRate,
    formatCurrency,
    loading,
    error,
    lastUpdated
  };
}
