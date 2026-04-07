import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import api from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Chip from '@mui/material/Chip';
import Popover from '@mui/material/Popover';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CategoryIcon from '@mui/icons-material/Category';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import PersonIcon from '@mui/icons-material/Person';
import PlaceIcon from '@mui/icons-material/Place';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CloseIcon from '@mui/icons-material/Close';
import CircularProgress from '@mui/material/CircularProgress';
import Collapse from '@mui/material/Collapse';
import TodayIcon from '@mui/icons-material/Today';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

/* ─── Color tokens ─── */
const C = {
  bg: 'var(--bg-primary)', surface: 'var(--bg-surface)', elevated: 'var(--bg-elevated)',
  card: 'var(--bg-card)', border: 'var(--border-subtle)', borderEmph: 'var(--border-emph)',
  brand: '#2563EB', amber: '#F59E0B', red: '#EF4444', blue: '#3B82F6', cyan: '#06B6D4', purple: '#A855F7',
  textPri: 'var(--text-primary)', textSec: 'var(--text-secondary)', textMut: 'var(--text-muted)',
};
const EMPLOYEE_COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981', '#A855F7', '#06B6D4', '#EC4899', '#8B5CF6', '#F97316', '#14B8A6', '#6366F1', '#84CC16'];
const WEEKDAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function Jadwal() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const calendarRef = useRef(null);

  const [shifts, setShifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [locations, setLocations] = useState([]);

  // Filters
  const [filterUser, setFilterUser] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // Dialogs
  const [shiftDialog, setShiftDialog] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [catDialog, setCatDialog] = useState(false);
  const [bulkDialog, setBulkDialog] = useState(false);

  // Shift form state
  const [form, setForm] = useState({ user_id: '', category_id: '', date: '', start_datetime: '', end_datetime: '', location_id: '', notes: '' });

  // Category form state
  const [catForm, setCatForm] = useState({ name: '', start_time: '', end_time: '', color: '#2563EB', is_custom: true });
  const [editingCat, setEditingCat] = useState(null);

  // Bulk form state
  const [bulkForm, setBulkForm] = useState({ user_id: '', category_id: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(), weekdays: [1, 2, 3, 4, 5] });

  // Popover for event detail
  const [popAnchor, setPopAnchor] = useState(null);
  const [popShift, setPopShift] = useState(null);

  // Roster panel toggle
  const [rosterOpen, setRosterOpen] = useState(false);

  // Date range tracked from calendar
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // ── Load reference data ──
  useEffect(() => {
    api.get('/shift-categories').then(r => setCategories(r.data || [])).catch(() => {});
    api.get('/locations').then(r => setLocations(r.data || [])).catch(() => {});
    if (isAdmin || user?.role === 'owner') {
      api.get('/users', { params: { limit: 200 } }).then(r => {
        const list = r.data?.data || r.data || [];
        setUsers(list.filter(u => u.is_active !== false));
      }).catch(() => {});
    }
  }, [isAdmin, user?.role]);

  // ── Fetch shifts ──
  const fetchShifts = useCallback(async (start, end) => {
    setLoading(true);
    try {
      const params = { start, end };
      if (filterUser) params.user_id = filterUser;
      if (filterLocation) params.location_id = filterLocation;
      if (filterCategory) params.category_id = filterCategory;
      const res = await api.get('/employee-shifts', { params });
      setShifts(res.data || []);
    } catch {
      toast.error('Gagal memuat jadwal');
    } finally {
      setLoading(false);
    }
  }, [filterUser, filterLocation, filterCategory]);

  // Refetch when filters change
  useEffect(() => {
    if (dateRange.start && dateRange.end) fetchShifts(dateRange.start, dateRange.end);
  }, [fetchShifts, dateRange]);

  // ── Computed data for panels ──
  const employeeColorMap = useMemo(() => {
    const map = {};
    shifts.forEach(s => {
      if (s.user_id && !map[s.user_id]) {
        map[s.user_id] = {
          name: s.employee?.full_name || 'N/A',
          role: s.employee?.role || '',
          color: EMPLOYEE_COLORS[s.user_id % EMPLOYEE_COLORS.length],
        };
      }
    });
    return map;
  }, [shifts]);

  const _now = new Date();
  const todayStr = `${_now.getFullYear()}-${String(_now.getMonth() + 1).padStart(2, '0')}-${String(_now.getDate()).padStart(2, '0')}`;

  const todayShifts = useMemo(() =>
    shifts.filter(s => s.date === todayStr).sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime)),
  [shifts, todayStr]);

  const rosterByEmployee = useMemo(() => {
    const grouped = {};
    shifts.forEach(s => {
      const key = s.user_id;
      if (!grouped[key]) grouped[key] = { name: s.employee?.full_name || 'N/A', role: s.employee?.role || '', color: employeeColorMap[key]?.color || EMPLOYEE_COLORS[key % EMPLOYEE_COLORS.length], shifts: [] };
      grouped[key].shifts.push(s);
    });
    Object.values(grouped).forEach(g => g.shifts.sort((a, b) => new Date(a.start_datetime) - new Date(b.start_datetime)));
    return Object.values(grouped).sort((a, b) => a.name.localeCompare(b.name));
  }, [shifts, employeeColorMap]);

  // Map shifts → FullCalendar events
  const calendarEvents = shifts.map((s) => {
    const empName = s.employee?.full_name || 'N/A';
    const catName = s.category?.name || '';
    const color = employeeColorMap[s.user_id]?.color || EMPLOYEE_COLORS[(s.user_id || 0) % EMPLOYEE_COLORS.length];
    return {
      id: String(s.id),
      title: `${empName}${catName ? ` – ${catName}` : ''}`,
      start: s.start_datetime,
      end: s.end_datetime,
      backgroundColor: color,
      borderColor: color,
      extendedProps: { shift: s },
    };
  });

  // ── Calendar callbacks ──
  const handleDatesSet = useCallback((info) => {
    const start = info.startStr.split('T')[0];
    const end = info.endStr.split('T')[0];
    setDateRange({ start, end });
  }, []);

  const handleDateSelect = (info) => {
    if (!isAdmin) return;
    const startDt = info.startStr;
    const endDt = info.endStr;
    const date = startDt.split('T')[0] || startDt;
    setEditingShift(null);
    setForm({ user_id: '', category_id: '', date, start_datetime: startDt.includes('T') ? startDt.substring(0, 16) : '', end_datetime: endDt.includes('T') ? endDt.substring(0, 16) : '', location_id: '', notes: '' });
    setShiftDialog(true);
  };

  const handleEventClick = (info) => {
    const s = info.event.extendedProps.shift;
    setPopShift(s);
    setPopAnchor(info.el);
  };

  const handleEventDrop = async (info) => {
    const s = info.event.extendedProps.shift;
    try {
      await api.put(`/employee-shifts/${s.id}`, {
        start_datetime: info.event.startStr,
        end_datetime: info.event.endStr,
        date: info.event.startStr.split('T')[0],
      });
      toast.success('Jadwal dipindahkan');
      fetchShifts(dateRange.start, dateRange.end);
    } catch (err) {
      info.revert();
      toast.error(err.response?.data?.message || 'Gagal memindahkan');
    }
  };

  const handleEventResize = async (info) => {
    const s = info.event.extendedProps.shift;
    try {
      await api.put(`/employee-shifts/${s.id}`, {
        start_datetime: info.event.startStr,
        end_datetime: info.event.endStr,
      });
      toast.success('Durasi diperbarui');
      fetchShifts(dateRange.start, dateRange.end);
    } catch (err) {
      info.revert();
      toast.error(err.response?.data?.message || 'Gagal mengubah durasi');
    }
  };

  // ── Auto-fill times from category ──
  const handleCategoryChange = (catId) => {
    setForm(f => ({ ...f, category_id: catId }));
    if (!catId || !form.date) return;
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;
    const startDt = `${form.date}T${cat.start_time.substring(0, 5)}`;
    let endDate = form.date;
    if (cat.end_time <= cat.start_time) {
      const nd = new Date(form.date);
      nd.setDate(nd.getDate() + 1);
      endDate = nd.toISOString().split('T')[0];
    }
    const endDt = `${endDate}T${cat.end_time.substring(0, 5)}`;
    setForm(f => ({ ...f, start_datetime: startDt, end_datetime: endDt }));
  };

  // ── Submit shift ──
  const submitShift = async () => {
    try {
      const body = { ...form };
      if (!body.location_id) delete body.location_id;
      if (editingShift) {
        await api.put(`/employee-shifts/${editingShift.id}`, body);
        toast.success('Jadwal berhasil diperbarui');
      } else {
        await api.post('/employee-shifts', body);
        toast.success('Jadwal berhasil dibuat');
      }
      setShiftDialog(false);
      fetchShifts(dateRange.start, dateRange.end);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan jadwal');
    }
  };

  const openEditShift = (s) => {
    setPopAnchor(null);
    setEditingShift(s);
    const startLocal = s.start_datetime ? new Date(s.start_datetime).toISOString().substring(0, 16) : '';
    const endLocal = s.end_datetime ? new Date(s.end_datetime).toISOString().substring(0, 16) : '';
    setForm({
      user_id: s.user_id, category_id: s.category_id || '', date: s.date,
      start_datetime: startLocal, end_datetime: endLocal,
      location_id: s.location_id || '', notes: s.notes || '',
    });
    setShiftDialog(true);
  };

  const deleteShift = async (id) => {
    try {
      await api.delete(`/employee-shifts/${id}`);
      toast.success('Jadwal dihapus');
      setPopAnchor(null);
      fetchShifts(dateRange.start, dateRange.end);
    } catch {
      toast.error('Gagal menghapus');
    }
  };

  // ── Category management ──
  const submitCategory = async () => {
    try {
      if (editingCat) {
        await api.put(`/shift-categories/${editingCat.id}`, catForm);
        toast.success('Kategori diperbarui');
      } else {
        await api.post('/shift-categories', catForm);
        toast.success('Kategori dibuat');
      }
      setEditingCat(null);
      setCatForm({ name: '', start_time: '', end_time: '', color: '#2563EB', is_custom: true });
      const res = await api.get('/shift-categories');
      setCategories(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan kategori');
    }
  };

  const deleteCategory = async (id) => {
    try {
      await api.delete(`/shift-categories/${id}`);
      toast.success('Kategori dihapus');
      const res = await api.get('/shift-categories');
      setCategories(res.data || []);
    } catch {
      toast.error('Gagal menghapus kategori');
    }
  };

  // ── Bulk generate ──
  const submitBulk = async () => {
    try {
      const res = await api.post('/employee-shifts/bulk', bulkForm);
      toast.success(res.message || `${res.data?.created} jadwal dibuat`);
      setBulkDialog(false);
      fetchShifts(dateRange.start, dateRange.end);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Gagal generate jadwal');
    }
  };

  const formatTime = (dt) => dt ? new Date(dt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';
  const formatDate = (dt) => dt ? new Date(dt).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  // ── Custom event content with hover tooltip ──
  const renderEventContent = (eventInfo) => {
    const s = eventInfo.event.extendedProps.shift;
    const tipContent = (
      <Box sx={{ p: 0.5 }}>
        <Typography variant="caption" fontWeight={700} display="block">{s.employee?.full_name}</Typography>
        <Typography variant="caption" display="block">{formatTime(s.start_datetime)} – {formatTime(s.end_datetime)}</Typography>
        {s.category && <Typography variant="caption" display="block">Shift: {s.category.name}</Typography>}
        {s.location && <Typography variant="caption" display="block">Lokasi: {s.location.name}</Typography>}
        {s.employee?.role && <Typography variant="caption" display="block">Role: {s.employee.role}</Typography>}
      </Box>
    );
    return (
      <Tooltip title={tipContent} arrow placement="top" enterDelay={300}>
        <Box sx={{ px: 0.5, py: 0.25, overflow: 'hidden', lineHeight: 1.3, width: '100%', cursor: 'pointer' }}>
          <Typography variant="caption" sx={{ fontWeight: 700, display: 'block', color: 'inherit', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {s.employee?.full_name || 'N/A'}
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.85)', display: 'block' }}>
            {formatTime(s.start_datetime)}–{formatTime(s.end_datetime)}
          </Typography>
        </Box>
      </Tooltip>
    );
  };

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'auto', bgcolor: C.bg }}>
      {/* ── Header ── */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
        <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, color: C.textPri }}>
          <CalendarMonthIcon /> Jadwal Karyawan
        </Typography>
        {isAdmin && (
          <Stack direction="row" spacing={1}>
            <Button size="small" variant="outlined" startIcon={<CategoryIcon />} onClick={() => setCatDialog(true)} sx={{ borderRadius: 2, textTransform: 'none' }}>
              Kategori
            </Button>
            <Button size="small" variant="outlined" startIcon={<AutorenewIcon />} onClick={() => setBulkDialog(true)} sx={{ borderRadius: 2, textTransform: 'none' }}>
              Generate
            </Button>
            <Button size="small" variant="contained" startIcon={<AddIcon />} onClick={() => { setEditingShift(null); setForm({ user_id: '', category_id: '', date: new Date().toISOString().split('T')[0], start_datetime: '', end_datetime: '', location_id: '', notes: '' }); setShiftDialog(true); }} sx={{ borderRadius: 2, textTransform: 'none' }}>
              Tambah Shift
            </Button>
          </Stack>
        )}
      </Stack>

      {/* ── Filters ── */}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} flexWrap="wrap">
        {(isAdmin || user?.role === 'owner') && users.length > 0 && (
          <TextField select size="small" label="Karyawan" value={filterUser} onChange={e => setFilterUser(e.target.value)} sx={{ minWidth: 180 }}>
            <MenuItem value="">Semua</MenuItem>
            {users.map(u => <MenuItem key={u.id} value={u.id}>{u.full_name}</MenuItem>)}
          </TextField>
        )}
        {locations.length > 0 && (
          <TextField select size="small" label="Lokasi" value={filterLocation} onChange={e => setFilterLocation(e.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value="">Semua</MenuItem>
            {locations.map(l => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
          </TextField>
        )}
        {categories.length > 0 && (
          <TextField select size="small" label="Kategori" value={filterCategory} onChange={e => setFilterCategory(e.target.value)} sx={{ minWidth: 160 }}>
            <MenuItem value="">Semua</MenuItem>
            {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
          </TextField>
        )}
      </Stack>

      {/* ── Employee Legend ── */}
      {Object.keys(employeeColorMap).length > 0 && (
        <Stack direction="row" spacing={0.75} flexWrap="wrap" alignItems="center" sx={{ mb: 2, p: 1.5, bgcolor: C.surface, borderRadius: 2, border: `1px solid ${C.border}` }}>
          <Typography variant="caption" sx={{ color: C.textMut, fontWeight: 600, mr: 0.5 }}>Karyawan:</Typography>
          {Object.entries(employeeColorMap).map(([uid, emp]) => (
            <Chip key={uid} size="small" label={emp.name}
              icon={<Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: emp.color, flexShrink: 0 }} />}
              sx={{ bgcolor: `${emp.color}18`, color: C.textPri, border: `1px solid ${emp.color}40`, fontWeight: 500, fontSize: '0.75rem', '& .MuiChip-icon': { ml: 0.5 } }}
            />
          ))}
        </Stack>
      )}

      {/* ── Calendar ── */}
      <Box sx={{ bgcolor: C.surface, borderRadius: 3, border: `1px solid ${C.border}`, p: { xs: 1, md: 2 }, '.fc': { fontFamily: 'inherit' }, position: 'relative' }}>
        {loading && (
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', bgcolor: 'rgba(0,0,0,0.08)', zIndex: 10, borderRadius: 3 }}>
            <CircularProgress />
          </Box>
        )}
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="id"
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay',
          }}
          buttonText={{ today: 'Hari Ini', month: 'Bulan', week: 'Minggu', day: 'Hari' }}
          events={calendarEvents}
          editable={isAdmin}
          selectable={isAdmin}
          selectMirror
          dayMaxEvents={3}
          eventDisplay="block"
          height="auto"
          datesSet={handleDatesSet}
          select={handleDateSelect}
          eventClick={handleEventClick}
          eventDrop={handleEventDrop}
          eventResize={handleEventResize}
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
          eventContent={renderEventContent}
        />
      </Box>

      {/* ── Siapa yang Jaga Hari Ini ── */}
      <Box sx={{ mt: 2, bgcolor: C.surface, borderRadius: 3, border: `1px solid ${C.border}`, p: 2 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
          <TodayIcon sx={{ color: C.brand, fontSize: 20 }} />
          <Typography variant="subtitle1" fontWeight={700} sx={{ color: C.textPri }}>Siapa yang Jaga Hari Ini</Typography>
          <Chip size="small" label={new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            sx={{ bgcolor: `${C.brand}14`, color: C.brand, fontWeight: 600, fontSize: '0.7rem' }} />
        </Stack>
        {todayShifts.length === 0 ? (
          <Typography variant="body2" sx={{ color: C.textMut, textAlign: 'center', py: 2 }}>Tidak ada jadwal hari ini</Typography>
        ) : (
          <Stack spacing={1}>
            {todayShifts.map(s => {
              const empColor = employeeColorMap[s.user_id]?.color || C.blue;
              return (
                <Stack key={s.id} direction="row" alignItems="center" spacing={1.5}
                  sx={{ p: 1, borderRadius: 2, bgcolor: C.elevated, cursor: 'pointer', '&:hover': { bgcolor: `${empColor}10` } }}
                  onClick={(e) => { setPopShift(s); setPopAnchor(e.currentTarget); }}>
                  <Box sx={{ width: 4, height: 36, borderRadius: 1, bgcolor: empColor, flexShrink: 0 }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} sx={{ color: C.textPri }}>{s.employee?.full_name || '-'}</Typography>
                    <Typography variant="caption" sx={{ color: C.textMut }}>
                      {s.category?.name || 'Shift'} · {formatTime(s.start_datetime)} – {formatTime(s.end_datetime)}
                      {s.location ? ` · ${s.location.name}` : ''}
                    </Typography>
                  </Box>
                  <Chip size="small" label={s.employee?.role || '-'} sx={{ fontSize: '0.65rem', height: 20, bgcolor: `${empColor}18`, color: empColor, fontWeight: 600 }} />
                </Stack>
              );
            })}
          </Stack>
        )}
      </Box>

      {/* ── Roster Lengkap ── */}
      <Box sx={{ mt: 2, mb: 2, bgcolor: C.surface, borderRadius: 3, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between"
          sx={{ p: 2, cursor: 'pointer', userSelect: 'none', '&:hover': { bgcolor: C.elevated } }}
          onClick={() => setRosterOpen(v => !v)}>
          <Stack direction="row" spacing={1} alignItems="center">
            <FormatListBulletedIcon sx={{ color: C.brand, fontSize: 20 }} />
            <Typography variant="subtitle1" fontWeight={700} sx={{ color: C.textPri }}>Roster Lengkap</Typography>
            <Chip size="small" label={`${shifts.length} shift`} sx={{ fontSize: '0.65rem', height: 20, bgcolor: C.elevated, color: C.textMut }} />
          </Stack>
          {rosterOpen ? <ExpandLessIcon sx={{ color: C.textMut }} /> : <ExpandMoreIcon sx={{ color: C.textMut }} />}
        </Stack>
        <Collapse in={rosterOpen}>
          <Divider />
          <Box sx={{ p: 2, maxHeight: 400, overflow: 'auto' }}>
            {rosterByEmployee.length === 0 ? (
              <Typography variant="body2" sx={{ color: C.textMut, textAlign: 'center', py: 2 }}>Belum ada jadwal</Typography>
            ) : (
              <Stack spacing={2}>
                {rosterByEmployee.map(emp => (
                  <Box key={emp.name}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: emp.color, flexShrink: 0 }} />
                      <Typography variant="body2" fontWeight={700} sx={{ color: C.textPri }}>{emp.name}</Typography>
                      <Typography variant="caption" sx={{ color: C.textMut }}>({emp.role})</Typography>
                      <Chip size="small" label={`${emp.shifts.length} shift`} sx={{ fontSize: '0.6rem', height: 18, bgcolor: `${emp.color}18`, color: emp.color }} />
                    </Stack>
                    <Stack spacing={0.5} sx={{ pl: 2.5 }}>
                      {emp.shifts.map(s => {
                        const isToday = s.date === todayStr;
                        return (
                          <Stack key={s.id} direction="row" spacing={1} alignItems="center"
                            sx={{ py: 0.25, cursor: 'pointer', borderRadius: 1, px: 0.5, bgcolor: isToday ? `${C.brand}08` : 'transparent', '&:hover': { bgcolor: `${emp.color}10` } }}
                            onClick={(e) => { setPopShift(s); setPopAnchor(e.currentTarget); }}>
                            <Typography variant="caption" sx={{ color: isToday ? C.brand : C.textSec, fontWeight: isToday ? 700 : 400, minWidth: 90 }}>
                              {new Date(s.date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                            </Typography>
                            <Typography variant="caption" sx={{ color: C.textMut }}>{formatTime(s.start_datetime)}–{formatTime(s.end_datetime)}</Typography>
                            {s.category && <Typography variant="caption" sx={{ color: C.textMut }}>· {s.category.name}</Typography>}
                            {s.location && <Typography variant="caption" sx={{ color: C.textMut }}>· {s.location.name}</Typography>}
                            {isToday && <Chip size="small" label="Hari Ini" sx={{ fontSize: '0.55rem', height: 16, bgcolor: C.brand, color: '#fff', fontWeight: 700 }} />}
                          </Stack>
                        );
                      })}
                    </Stack>
                  </Box>
                ))}
              </Stack>
            )}
          </Box>
        </Collapse>
      </Box>

      {/* ── Event Detail Popover ── */}
      <Popover open={Boolean(popAnchor)} anchorEl={popAnchor} onClose={() => setPopAnchor(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        PaperProps={{ sx: { bgcolor: C.surface, border: `1px solid ${C.border}`, borderRadius: 3, p: 2, minWidth: 260, maxWidth: 320 } }}>
        {popShift && (
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ color: C.textPri }}>Detail Jadwal</Typography>
              <IconButton size="small" onClick={() => setPopAnchor(null)}><CloseIcon fontSize="small" /></IconButton>
            </Stack>
            <Divider sx={{ mb: 1.5 }} />
            <Stack spacing={1}>
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonIcon sx={{ fontSize: 18, color: C.textMut }} />
                <Typography variant="body2" sx={{ color: C.textPri }}>{popShift.employee?.full_name || '-'}</Typography>
              </Stack>
              {popShift.category && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: popShift.category.color, flexShrink: 0 }} />
                  <Typography variant="body2" sx={{ color: C.textPri }}>{popShift.category.name} ({popShift.category.start_time?.substring(0,5)} – {popShift.category.end_time?.substring(0,5)})</Typography>
                </Stack>
              )}
              <Stack direction="row" spacing={1} alignItems="center">
                <AccessTimeIcon sx={{ fontSize: 18, color: C.textMut }} />
                <Typography variant="body2" sx={{ color: C.textSec }}>{formatDate(popShift.start_datetime)}</Typography>
              </Stack>
              <Typography variant="body2" sx={{ color: C.textSec, pl: 3.5 }}>{formatTime(popShift.start_datetime)} – {formatTime(popShift.end_datetime)}</Typography>
              {popShift.location && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <PlaceIcon sx={{ fontSize: 18, color: C.textMut }} />
                  <Typography variant="body2" sx={{ color: C.textSec }}>{popShift.location.name}</Typography>
                </Stack>
              )}
              {popShift.notes && <Typography variant="body2" sx={{ color: C.textMut, fontStyle: 'italic' }}>{popShift.notes}</Typography>}
            </Stack>
            {isAdmin && (
              <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                <Button size="small" variant="outlined" startIcon={<EditIcon />} onClick={() => openEditShift(popShift)} sx={{ borderRadius: 2, textTransform: 'none', flex: 1 }}>Edit</Button>
                <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => deleteShift(popShift.id)} sx={{ borderRadius: 2, textTransform: 'none', flex: 1 }}>Hapus</Button>
              </Stack>
            )}
          </Box>
        )}
      </Popover>

      {/* ── Shift Form Dialog ── */}
      <Dialog open={shiftDialog} onClose={() => setShiftDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: C.surface, borderRadius: 3 } }}>
        <DialogTitle sx={{ color: C.textPri, fontWeight: 700 }}>{editingShift ? 'Edit Jadwal' : 'Tambah Jadwal Shift'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select label="Karyawan" value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })} size="small" required>
              {users.map(u => <MenuItem key={u.id} value={u.id}>{u.full_name} ({u.role})</MenuItem>)}
            </TextField>
            <TextField select label="Kategori Waktu" value={form.category_id} onChange={e => handleCategoryChange(e.target.value)} size="small">
              <MenuItem value="">— Tanpa Kategori —</MenuItem>
              {categories.map(c => (
                <MenuItem key={c.id} value={c.id}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color }} />
                    <span>{c.name} ({c.start_time?.substring(0,5)} – {c.end_time?.substring(0,5)})</span>
                  </Stack>
                </MenuItem>
              ))}
            </TextField>
            <TextField type="date" label="Tanggal" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} size="small" InputLabelProps={{ shrink: true }} required />
            <Stack direction="row" spacing={2}>
              <TextField type="datetime-local" label="Mulai" value={form.start_datetime} onChange={e => setForm({ ...form, start_datetime: e.target.value })} size="small" InputLabelProps={{ shrink: true }} fullWidth required />
              <TextField type="datetime-local" label="Selesai" value={form.end_datetime} onChange={e => setForm({ ...form, end_datetime: e.target.value })} size="small" InputLabelProps={{ shrink: true }} fullWidth required />
            </Stack>
            <TextField select label="Lokasi" value={form.location_id} onChange={e => setForm({ ...form, location_id: e.target.value })} size="small">
              <MenuItem value="">— Opsional —</MenuItem>
              {locations.map(l => <MenuItem key={l.id} value={l.id}>{l.name}</MenuItem>)}
            </TextField>
            <TextField label="Catatan" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} size="small" multiline rows={2} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setShiftDialog(false)} sx={{ textTransform: 'none' }}>Batal</Button>
          <Button variant="contained" onClick={submitShift} sx={{ textTransform: 'none', borderRadius: 2 }}>{editingShift ? 'Simpan' : 'Buat Jadwal'}</Button>
        </DialogActions>
      </Dialog>

      {/* ── Category Manage Dialog ── */}
      <Dialog open={catDialog} onClose={() => { setCatDialog(false); setEditingCat(null); }} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: C.surface, borderRadius: 3 } }}>
        <DialogTitle sx={{ color: C.textPri, fontWeight: 700 }}>Kategori Waktu Shift</DialogTitle>
        <DialogContent>
          {/* Existing categories */}
          <Stack spacing={1} sx={{ mb: 3 }}>
            {categories.map(c => (
              <Stack key={c.id} direction="row" alignItems="center" spacing={1} sx={{ p: 1, borderRadius: 2, bgcolor: C.elevated }}>
                <Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: c.color, flexShrink: 0 }} />
                <Typography variant="body2" sx={{ flex: 1, color: C.textPri, fontWeight: 600 }}>{c.name}</Typography>
                <Typography variant="caption" sx={{ color: C.textMut }}>{c.start_time?.substring(0,5)} – {c.end_time?.substring(0,5)}</Typography>
                {c.is_custom && (
                  <>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => { setEditingCat(c); setCatForm({ name: c.name, start_time: c.start_time.substring(0,5), end_time: c.end_time.substring(0,5), color: c.color, is_custom: c.is_custom }); }}><EditIcon fontSize="small" /></IconButton></Tooltip>
                    <Tooltip title="Hapus"><IconButton size="small" color="error" onClick={() => deleteCategory(c.id)}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
                  </>
                )}
              </Stack>
            ))}
            {categories.length === 0 && <Typography variant="body2" sx={{ color: C.textMut, textAlign: 'center', py: 2 }}>Belum ada kategori</Typography>}
          </Stack>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="subtitle2" sx={{ mb: 1, color: C.textSec }}>{editingCat ? 'Edit Kategori' : 'Tambah Kategori Baru'}</Typography>
          <Stack spacing={2}>
            <TextField label="Nama" value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} size="small" />
            <Stack direction="row" spacing={2}>
              <TextField type="time" label="Mulai" value={catForm.start_time} onChange={e => setCatForm({ ...catForm, start_time: e.target.value })} size="small" InputLabelProps={{ shrink: true }} fullWidth />
              <TextField type="time" label="Selesai" value={catForm.end_time} onChange={e => setCatForm({ ...catForm, end_time: e.target.value })} size="small" InputLabelProps={{ shrink: true }} fullWidth />
            </Stack>
            <TextField type="color" label="Warna" value={catForm.color} onChange={e => setCatForm({ ...catForm, color: e.target.value })} size="small" InputLabelProps={{ shrink: true }} sx={{ width: 120 }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => { setCatDialog(false); setEditingCat(null); }} sx={{ textTransform: 'none' }}>Tutup</Button>
          <Button variant="contained" onClick={submitCategory} disabled={!catForm.name || !catForm.start_time || !catForm.end_time} sx={{ textTransform: 'none', borderRadius: 2 }}>
            {editingCat ? 'Simpan' : 'Tambah'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Bulk Generate Dialog ── */}
      <Dialog open={bulkDialog} onClose={() => setBulkDialog(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { bgcolor: C.surface, borderRadius: 3 } }}>
        <DialogTitle sx={{ color: C.textPri, fontWeight: 700 }}>Generate Jadwal Otomatis</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select label="Karyawan" value={bulkForm.user_id} onChange={e => setBulkForm({ ...bulkForm, user_id: e.target.value })} size="small" required>
              {users.map(u => <MenuItem key={u.id} value={u.id}>{u.full_name}</MenuItem>)}
            </TextField>
            <TextField select label="Kategori Waktu" value={bulkForm.category_id} onChange={e => setBulkForm({ ...bulkForm, category_id: e.target.value })} size="small" required>
              {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
            </TextField>
            <Stack direction="row" spacing={2}>
              <TextField type="number" label="Bulan" value={bulkForm.month} onChange={e => setBulkForm({ ...bulkForm, month: parseInt(e.target.value) })} size="small" inputProps={{ min: 1, max: 12 }} fullWidth />
              <TextField type="number" label="Tahun" value={bulkForm.year} onChange={e => setBulkForm({ ...bulkForm, year: parseInt(e.target.value) })} size="small" fullWidth />
            </Stack>
            <Box>
              <Typography variant="body2" sx={{ mb: 1, color: C.textSec }}>Hari yang dijadwalkan:</Typography>
              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                {WEEKDAY_LABELS.map((label, idx) => (
                  <Chip
                    key={idx}
                    label={label}
                    size="small"
                    onClick={() => {
                      const wd = bulkForm.weekdays.includes(idx) ? bulkForm.weekdays.filter(w => w !== idx) : [...bulkForm.weekdays, idx];
                      setBulkForm({ ...bulkForm, weekdays: wd });
                    }}
                    sx={{
                      fontWeight: 600,
                      bgcolor: bulkForm.weekdays.includes(idx) ? `${C.brand}20` : C.elevated,
                      color: bulkForm.weekdays.includes(idx) ? C.brand : C.textMut,
                      border: `1px solid ${bulkForm.weekdays.includes(idx) ? C.brand : C.border}`,
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button onClick={() => setBulkDialog(false)} sx={{ textTransform: 'none' }}>Batal</Button>
          <Button variant="contained" onClick={submitBulk} disabled={!bulkForm.user_id || !bulkForm.category_id} sx={{ textTransform: 'none', borderRadius: 2 }}>Generate</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
