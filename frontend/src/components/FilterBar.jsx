import { useEffect, useState } from 'react';
import { api } from '../api/client.js';

export default function FilterBar({ filters, onChange }) {
  const [districts, setDistricts] = useState([]);
  const [services, setServices] = useState([]);
  const [localSearch, setLocalSearch] = useState(filters.search);

  useEffect(() => {
    api.getDistricts().then(setDistricts).catch(() => {});
    api.getServices().then(setServices).catch(() => {});
  }, []);

  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        onChange((prev) => ({ ...prev, search: localSearch }));
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [localSearch, onChange, filters.search]);

  const setDropdown = (key) => (e) => onChange((prev) => ({ ...prev, [key]: e.target.value }));
  
  const clear = () => {
    setLocalSearch('');
    onChange({ district: '', service: '', search: '', min_rating: '' });
  };

  const hasFilters = Object.values(filters).some(Boolean);

  return (
    <div style={styles.bar}>
      <div style={styles.searchWrapper}>
        <input
          style={styles.input}
          placeholder="Search by salon name..."
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
        />
      </div>
      <select style={styles.select} value={filters.district} onChange={setDropdown('district')}>
        <option value="">All Districts</option>
        {districts.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
      <select style={styles.select} value={filters.service} onChange={setDropdown('service')}>
        <option value="">All Services</option>
        {services.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <select style={styles.select} value={filters.min_rating} onChange={setDropdown('min_rating')}>
        <option value="">Any Rating</option>
        <option value="4.5">★ 4.5 & up</option>
        <option value="4.0">★ 4.0 & up</option>
        <option value="3.5">★ 3.5 & up</option>
      </select>
      {hasFilters && (
        <button style={styles.clear} onClick={clear}>Clear filters</button>
      )}
    </div>
  );
}

const styles = {
  bar: { 
    display: 'flex', 
    flexWrap: 'wrap', 
    gap: 12, 
    marginBottom: 32,
    alignItems: 'center'
  },
  searchWrapper: {
    flex: '2 1 240px',
  },
  input: { 
    width: '100%',
    padding: '11px 16px', 
    borderRadius: 8, 
    border: '1px solid #e5e5e5', 
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
    background: '#fff',
    color: '#1a1a1a',
    transition: 'border-color 0.15s ease'
  },
  select: { 
    flex: '1 1 160px', 
    padding: '11px 16px', 
    borderRadius: 8, 
    border: '1px solid #e5e5e5', 
    fontSize: 14, 
    background: '#fff',
    color: '#1a1a1a',
    outline: 'none',
    cursor: 'pointer'
  },
  clear: { 
    padding: '11px 18px', 
    borderRadius: 8, 
    border: '1px solid #e5e5e5', 
    background: '#fff', 
    color: '#666', 
    cursor: 'pointer', 
    fontSize: 14,
    fontWeight: 500,
    transition: 'all 0.15s ease'
  },
};