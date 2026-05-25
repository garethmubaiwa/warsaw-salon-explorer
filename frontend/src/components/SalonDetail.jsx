import { useState, useEffect } from 'react';
import { api } from '../api/client.js';

export default function SalonDetail({ placeId, onBack }) {
  const [salon, setSalon] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [saveOk, setSaveOk] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getSalon(placeId)
      .then((data) => { setSalon(data); setDraft(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [placeId]);

  const startEdit = () => { setDraft({ ...salon }); setEditing(true); setSaveOk(false); setSaveError(null); };
  const cancelEdit = () => { setEditing(false); setDraft(salon); };

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    const changed = Object.fromEntries(
      Object.entries(draft).filter(([k, v]) => v !== salon[k])
    );
    if (Object.keys(changed).length === 0) { setEditing(false); setSaving(false); return; }
    try {
      const updated = await api.updateSalon(placeId, changed);
      setSalon(updated);
      setEditing(false);
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 3000);
    } catch (e) {
      setSaveError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const field = (key) => ({
    value: draft[key] ?? '',
    onChange: (e) => setDraft((prev) => ({ ...prev, [key]: e.target.value })),
    style: styles.input,
    disabled: !editing,
  });

  if (loading) return <div style={styles.center}>Loading space...</div>;
  if (!salon) return <div style={styles.center}>Salon not found.</div>;

  const hours = salon.hours
    ? salon.hours.split('|').map((h) => { const [day, ...rest] = h.split(','); return { day, time: rest.join(' – ') }; })
    : [];

  return (
    <div style={styles.container}>
      <button style={styles.back} onClick={onBack}>← Back to list</button>

      {saveOk && <div style={styles.success}>✓ Changes saved successfully</div>}
      {saveError && <div style={styles.errBox}>⚠ {saveError}</div>}

      <div style={styles.mainLayout}>
        <div style={styles.leftColumn}>
          {salon.photo_url && (
            <img src={salon.photo_url} alt={salon.name} style={styles.hero}
              onError={(e) => { e.target.style.display = 'none'; }} />
          )}
          
          <div style={styles.identitySection}>
            {editing ? (
              <input {...field('name')} style={{ ...styles.input, fontSize: 24, fontWeight: 700, marginBottom: 8 }} />
            ) : (
              <h2 style={styles.h2}>{salon.name}</h2>
            )}
            <div style={styles.district}>📍 {salon.district ?? 'Warsaw'}</div>
            
            {salon.rating != null && (
              <div style={styles.ratingRow}>
                <span style={styles.ratingNum}>★ {salon.rating.toFixed(1)}</span>
                <span style={styles.ratingCount}>({salon.review_count} verified reviews)</span>
              </div>
            )}
          </div>

          {salon.description && (
            <Section title="About the space">
              {editing ? (
                <textarea {...field('description')} rows={4} style={styles.textarea} />
              ) : (
                <p style={styles.descriptionText}>{salon.description}</p>
              )}
            </Section>
          )}
        </div>

        <div style={styles.rightColumn}>
          <Section title="Contact Info">
            <Row label="Address" value={salon.address} editing={editing} field={field('address')} />
            <Row label="Phone" value={salon.phone} editing={editing} field={field('phone')} />
            <Row label="Website" value={salon.website} editing={editing} field={field('website')} href={salon.website} />
            <Row label="Booking" value={salon.booking_link} editing={editing} field={field('booking_link')} href={salon.booking_link} />
          </Section>

          <Section title="Offerings">
            {editing ? (
              <textarea {...field('services')} rows={3} style={styles.textarea} placeholder="Comma separated services..." />
            ) : (
              <ServiceTags services={salon.services} />
            )}
          </Section>

          {hours.length > 0 && (
            <Section title="Hours">
              <div style={styles.hoursGrid}>
                {hours.map(({ day, time }) => (
                  <div key={day} style={styles.hourRow}>
                    <span style={styles.day}>{day}</span>
                    <span style={styles.time}>{time}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <div style={styles.actions}>
            {!editing && <button style={styles.editBtn} onClick={startEdit}>Edit info</button>}
            {editing && (
              <>
                <button style={styles.saveBtn} onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save details'}</button>
                <button style={styles.cancelBtn} onClick={cancelEdit}>Cancel</button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={styles.sectionContainer}>
      <div style={styles.sectionTitle}>{title}</div>
      {children}
    </div>
  );
}

function Row({ label, value, editing, field, href }) {
  if (!editing && !value) return null;
  return (
    <div style={styles.rowLayout}>
      <span style={styles.rowLabel}>{label}</span>
      <div style={styles.rowValueContainer}>
        {editing ? (
          <input {...field} />
        ) : href ? (
          <a href={href} target="_blank" rel="noreferrer" style={styles.link}>{value}</a>
        ) : (
          <span style={styles.rowValueText}>{value}</span>
        )}
      </div>
    </div>
  );
}

function ServiceTags({ services }) {
  if (!services) return <span style={{ color: '#aaa', fontSize: 14 }}>—</span>;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {services.split(',').map(s => s.trim()).filter(Boolean).map(t => (
        <span key={t} style={styles.detailsTag}>{t}</span>
      ))}
    </div>
  );
}

const styles = {
  container: { maxWidth: 960, margin: '0 auto' },
  back: { background: 'none', border: 'none', color: '#1a1a1a', cursor: 'pointer', fontSize: 14, fontWeight: 500, padding: '0 0 24px', display: 'inline-block' },
  mainLayout: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48 },
  leftColumn: { display: 'flex', flexDirection: 'column', gap: 24 },
  rightColumn: { background: '#fff', border: '1px solid #f0f0f0', borderRadius: 12, padding: 28, height: 'fit-content', display: 'flex', flexDirection: 'column', gap: 24 },
  hero: { width: '100%', height: 260, objectFit: 'cover', borderRadius: 12, background: '#f5f5f7' },
  identitySection: { paddingBottom: 16, borderBottom: '1px solid #f0f0f0' },
  h2: { margin: '0 0 6px', fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px' },
  district: { color: '#666', fontSize: 14, marginBottom: 12 },
  ratingRow: { display: 'flex', alignItems: 'center', gap: 6 },
  ratingNum: { fontSize: 15, fontWeight: 700 },
  ratingCount: { fontSize: 13, color: '#888' },
  sectionContainer: { display: 'flex', flexDirection: 'column', gap: 10 },
  sectionTitle: { fontSize: 11, textTransform: 'uppercase', color: '#999', letterSpacing: '0.8px', fontWeight: 600 },
  rowLayout: { display: 'grid', gridTemplateColumns: '90px 1fr', gap: 12, alignItems: 'center', padding: '4px 0' },
  rowLabel: { color: '#888', fontSize: 13 },
  rowValueContainer: { fontSize: 14, minWidth: 0 },
  rowValueText: { color: '#1a1a1a' },
  link: { color: '#1a1a1a', textDecoration: 'underline', wordBreak: 'break-all' },
  descriptionText: { margin: 0, color: '#444', fontSize: 14, lineHeight: 1.6 },
  input: { padding: '8px 12px', borderRadius: 6, border: '1px solid #e5e5e5', fontSize: 14, width: '100%', boxSizing: 'border-box', outline: 'none' },
  textarea: { padding: '10px 12px', borderRadius: 6, border: '1px solid #e5e5e5', fontSize: 14, width: '100%', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', resize: 'vertical' },
  detailsTag: { background: '#f5f5f7', borderRadius: 6, padding: '5px 12px', fontSize: 13, color: '#333' },
  hoursGrid: { display: 'flex', flexDirection: 'column', gap: 6 },
  hourRow: { display: 'flex', justifyContent: 'space-between', fontSize: 13, borderBottom: '1px dashed #f0f0f0', paddingBottom: 4 },
  day: { fontWeight: 500, color: '#555' },
  time: { color: '#222' },
  actions: { marginTop: 12, display: 'flex', gap: 12 },
  editBtn: { width: '100%', padding: '12px', borderRadius: 8, border: 'none', background: '#1a1a1a', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  saveBtn: { flex: 1, padding: '12px', borderRadius: 8, border: 'none', background: '#1a1a1a', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  cancelBtn: { padding: '12px 20px', borderRadius: 8, border: '1px solid #e5e5e5', background: '#fff', color: '#666', cursor: 'pointer', fontSize: 14 },
  center: { textAlign: 'center', padding: 80, color: '#888', fontSize: 14 },
  success: { background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#065f46', fontSize: 14 },
  errBox: { background: '#fdf2f2', border: '1px solid #fbd5d5', borderRadius: 8, padding: '12px 16px', marginBottom: 20, color: '#9b1c1c', fontSize: 14 },
};