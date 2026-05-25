function RatingBadge({ rating }) {
  if (rating == null) return <span style={styles.noRating}>Unrated</span>;
  return <span style={styles.badge}>★ {rating.toFixed(1)}</span>;
}

function ServiceTags({ services }) {
  if (!services) return null;
  const tags = services.split(',').map((s) => s.trim()).filter(Boolean).slice(0, 2);
  return (
    <div style={styles.tags}>
      {tags.map((t) => <span key={t} style={styles.tag}>{t}</span>)}
    </div>
  );
}

function SalonCard({ salon, onSelect }) {
  return (
    <div style={styles.card} onClick={() => onSelect(salon.place_id)}>
      <div style={styles.photoContainer}>
        {salon.photo_url ? (
          <img
            src={salon.photo_url}
            alt={salon.name}
            style={styles.photo}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div style={styles.photoPlaceholder} />
        )}
      </div>
      <div style={styles.cardBody}>
        <div style={styles.cardTop}>
          <h3 style={styles.name}>{salon.name}</h3>
          <RatingBadge rating={salon.rating} />
        </div>
        <div style={styles.district}>{salon.district ?? 'Warsaw'}</div>
        <ServiceTags services={salon.services} />
      </div>
    </div>
  );
}

export default function SalonList({ salons, onSelect }) {
  if (salons.length === 0) {
    return <div style={styles.empty}>No salons match your filters. Try widening your search parameter fields.</div>;
  }
  return (
    <div>
      <div style={styles.count}>{salons.length} space{salons.length !== 1 ? 's' : ''} available</div>
      <div style={styles.grid}>
        {salons.map((s) => <SalonCard key={s.place_id} salon={s} onSelect={onSelect} />)}
      </div>
    </div>
  );
}

const styles = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 },
  card: { 
    background: '#fff', 
    borderRadius: 12, 
    border: '1px solid #f0f0f0',
    overflow: 'hidden', 
    cursor: 'pointer', 
    transition: 'transform 0.2s ease, border-color 0.2s ease', 
    display: 'flex', 
    flexDirection: 'column' 
  },
  photoContainer: { position: 'relative', width: '100%', height: 180, background: '#f5f5f7' },
  photo: { width: '100%', height: '100%', objectFit: 'cover' },
  photoPlaceholder: { width: '100%', height: '100%', background: '#eaeaea' },
  cardBody: { padding: 20, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  name: { margin: 0, fontSize: 16, fontWeight: 600, lineHeight: 1.4, color: '#1a1a1a' },
  badge: { fontSize: 13, fontWeight: 600, color: '#1a1a1a', whiteSpace: 'nowrap' },
  noRating: { fontSize: 12, color: '#999' },
  district: { fontSize: 13, color: '#666', fontWeight: 400 },
  tags: { display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  tag: { fontSize: 12, background: '#f5f5f7', borderRadius: 6, padding: '4px 10px', color: '#555', fontWeight: 400 },
  count: { marginBottom: 16, color: '#666', fontSize: 13, fontWeight: 500, letterSpacing: '0.3px' },
  empty: { textAlign: 'center', padding: '64px 0', color: '#888', fontSize: 14 },
};