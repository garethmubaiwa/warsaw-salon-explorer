import { useState, useEffect, useCallback } from 'react';
import { api } from './api/client.js';
import SalonList from './components/SalonList.jsx';
import SalonDetail from './components/SalonDetail.jsx';
import FilterBar from './components/FilterBar.jsx';

export default function App() {
  const [view, setView] = useState('list');       // 'list' or 'detail'
  const [selectedId, setSelectedId] = useState(null);
  const [salons, setSalons] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ district: '', service: '', search: '', min_rating: '' });

  const fetchSalons = useCallback(async (currentFilters) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listSalons(currentFilters);
      setSalons(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { 
    fetchSalons(filters); 
  }, [filters, fetchSalons]);

  const openDetail = (id) => { setSelectedId(id); setView('detail'); };
  const backToList = () => { setView('list'); setSelectedId(null); fetchSalons(filters); };

  return (
    <div style={styles.app}>
      <header style={styles.header}>
        <div style={styles.headerInner}>
          <h1 style={styles.logo} onClick={backToList}>Warsaw Salons</h1>
          <span style={styles.subtitle}>Discover prime beauty spaces</span>
        </div>
      </header>

      <main style={styles.main}>
        {view === 'list' && (
          <>
            <FilterBar filters={filters} onChange={setFilters} />
            {error && <div style={styles.error}>⚠ {error}</div>}
            {loading
              ? <div style={styles.center}>Loading spaces…</div>
              : <SalonList salons={salons} onSelect={openDetail} />
            }
          </>
        )}
        {view === 'detail' && (
          <SalonDetail placeId={selectedId} onBack={backToList} />
        )}
      </main>
    </div>
  );
}

const styles = {
  app: { 
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif', 
    minHeight: '100vh', 
    background: '#fcfcfd',
    color: '#1a1a1a'
  },
  header: { 
    background: '#fff', 
    borderBottom: '1px solid #ededed', 
    padding: '20px 0'
  },
  headerInner: { 
    maxWidth: 1000, 
    margin: '0 auto', 
    padding: '0 24px', 
    display: 'flex', 
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12
  },
  logo: { 
    margin: 0, 
    fontSize: 20, 
    cursor: 'pointer', 
    fontWeight: 700, 
    letterSpacing: '-0.5px',
    color: '#1a1a1a'
  },
  subtitle: { 
    fontSize: 13, 
    color: '#666',
    fontWeight: 400
  },
  main: { 
    maxWidth: 1000, 
    margin: '0 auto', 
    padding: '40px 24px' 
  },
  error: { 
    background: '#fdf2f2', 
    border: '1px solid #fbd5d5', 
    borderRadius: 8, 
    padding: '14px 16px', 
    marginBottom: 24,
    color: '#9b1c1c',
    fontSize: 14
  },
  center: { 
    textAlign: 'center', 
    padding: '80px 0', 
    color: '#8c8c8c',
    fontSize: 15,
    fontWeight: 500
  },
};