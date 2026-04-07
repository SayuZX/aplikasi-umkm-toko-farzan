import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Backdrop from '@mui/material/Backdrop';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Box from '@mui/material/Box';

export default function ConfirmDialog({
  open,
  title = 'Konfirmasi',
  message,
  confirmText = 'OK',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  icon,
  loading = false,
}) {
  return (
    <Dialog
      open={!!open}
      onClose={loading ? undefined : onCancel}
      maxWidth="xs"
      fullWidth
      slots={{ backdrop: Backdrop }}
      slotProps={{
        backdrop: {
          sx: {
            backgroundColor: 'rgba(0,0,0,0.32)',
          },
        },
      }}
      PaperProps={{
        elevation: 6,
        sx: {
          borderRadius: '28px',
          px: 1,
          py: 0.5,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1.5,
          pt: 3,
          pb: 0,
          fontWeight: 700,
          fontSize: '1.25rem',
          textAlign: 'center',
        }}
      >
        {icon !== undefined ? icon : (
          <Box
            sx={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              bgcolor: 'primary.main',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 0.5,
            }}
          >
            <ErrorOutlineIcon sx={{ color: 'primary.contrastText', fontSize: 28 }} />
          </Box>
        )}
        {title}
      </DialogTitle>

      <DialogContent sx={{ textAlign: 'center', pt: 1.5, pb: 1 }}>
        <Typography color="text.secondary" variant="body1">
          {message}
        </Typography>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', gap: 1, px: 3, pb: 3, pt: 1.5 }}>
        <Button
          variant="outlined"
          onClick={onCancel}
          disabled={loading}
          sx={{
            borderRadius: '24px',
            px: 3,
            minWidth: 100,
            fontWeight: 600,
            borderColor: 'divider',
            color: 'text.secondary',
            '&:hover': {
              borderColor: 'text.secondary',
              bgcolor: 'action.hover',
            },
          }}
        >
          {cancelText}
        </Button>
        <Button
          variant="contained"
          onClick={onConfirm}
          disabled={loading}
          sx={{
            borderRadius: '24px',
            px: 3,
            minWidth: 100,
            fontWeight: 600,
            boxShadow: 'none',
            '&:hover': { boxShadow: 'none' },
          }}
        >
          {loading ? 'Memproses...' : confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
