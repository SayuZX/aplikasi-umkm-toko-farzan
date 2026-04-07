import { useState, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';

const BANKS = [
  { id: 'bca', name: 'Bank BCA', logo: '/assets/banks/bca.svg' },
  { id: 'bri', name: 'Bank BRI', logo: '/assets/banks/bri.svg' },
  { id: 'mandiri', name: 'Bank Mandiri', logo: '/assets/banks/mandiri.svg' },
  { id: 'bni', name: 'Bank BNI', logo: '/assets/banks/bni.svg' },
  { id: 'bsi', name: 'Bank Syariah Indonesia', logo: '/assets/banks/bsi.svg' },
  { id: 'cimb', name: 'CIMB Niaga', logo: '/assets/banks/cimb.svg' },
  { id: 'btn', name: 'Bank BTN', logo: '/assets/banks/btn.svg' },
  { id: 'danamon', name: 'Bank Danamon', logo: '/assets/banks/danamon.svg' },
  { id: 'permata', name: 'PermataBank', logo: '/assets/banks/permata.svg' },
  { id: 'panin', name: 'Panin Bank', logo: '/assets/banks/panin.svg' },
  { id: 'ocbc', name: 'OCBC NISP', logo: '/assets/banks/ocbc.svg' },
  { id: 'mega', name: 'Bank Mega', logo: '/assets/banks/mega.svg' },
  { id: 'seabank', name: 'SeaBank', logo: '/assets/banks/seabank.svg' },
  { id: 'jago', name: 'Bank Jago', logo: '/assets/banks/jago.svg' },
];

export default function BankSelector({ value, onChange, error }) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search.trim()) return BANKS;
    const q = search.toLowerCase();
    return BANKS.filter(b => b.name.toLowerCase().includes(q) || b.id.includes(q));
  }, [search]);

  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>
        Pilih Bank Tujuan
      </Typography>

      {BANKS.length > 8 && (
        <TextField
          size="small"
          fullWidth
          placeholder="Cari bank..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ mb: 1.5 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" color="action" />
              </InputAdornment>
            ),
          }}
        />
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: 1,
          maxHeight: 260,
          overflowY: 'auto',
          pr: 0.5,
          '&::-webkit-scrollbar': { width: 4 },
          '&::-webkit-scrollbar-thumb': { bgcolor: 'divider', borderRadius: 2 },
        }}
      >
        {filtered.map((bank) => {
          const selected = value === bank.id;
          return (
            <Box
              key={bank.id}
              onClick={() => onChange(bank.id)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
                p: 1.5,
                borderRadius: 2,
                cursor: 'pointer',
                border: 2,
                borderColor: selected ? 'primary.main' : 'divider',
                bgcolor: selected ? 'primary.50' : 'background.paper',
                boxShadow: selected ? 2 : 0,
                transition: 'all 0.15s ease',
                '&:hover': {
                  borderColor: selected ? 'primary.main' : 'primary.light',
                  boxShadow: 1,
                  transform: 'translateY(-1px)',
                },
              }}
            >
              <Box
                component="img"
                src={bank.logo}
                alt={bank.name}
                sx={{
                  width: 64,
                  height: 32,
                  objectFit: 'contain',
                  borderRadius: 0.5,
                }}
              />
              <Typography
                variant="caption"
                fontWeight={selected ? 700 : 500}
                color={selected ? 'primary.main' : 'text.secondary'}
                sx={{ textAlign: 'center', lineHeight: 1.2 }}
                noWrap
              >
                {bank.name}
              </Typography>
            </Box>
          );
        })}
      </Box>

      {filtered.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
          Bank tidak ditemukan
        </Typography>
      )}

      {error && (
        <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}

export { BANKS };
