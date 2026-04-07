import { useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Chip from '@mui/material/Chip';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import StorefrontIcon from '@mui/icons-material/Storefront';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PointOfSaleIcon from '@mui/icons-material/PointOfSale';
import InventoryIcon from '@mui/icons-material/Inventory';
import AssessmentIcon from '@mui/icons-material/Assessment';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';
import PlaceIcon from '@mui/icons-material/Place';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CreditScoreIcon from '@mui/icons-material/CreditScore';
import PhonelinkIcon from '@mui/icons-material/Phonelink';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import SidebarItem from './SidebarItem';
import { useSidebarStore } from '../store/sidebarStore';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';
import { colors } from '../theme/colors';

const EXPANDED_WIDTH = 220;
const COLLAPSED_WIDTH = 64;

const NAV_SECTIONS = [
  {
    label: 'Transaksi',
    items: [
      { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon />, roles: ['admin', 'owner', 'kasir', 'staff', 'developer'] },
      { path: '/kasir', label: 'Penjualan', icon: <PointOfSaleIcon />, roles: ['admin', 'kasir'] },
      { path: '/layanan-digital', label: 'Layanan Digital', icon: <PhonelinkIcon />, roles: ['admin', 'owner', 'kasir', 'developer'] },
      { path: '/payment-history', label: 'Riwayat Bayar', icon: <ReceiptLongIcon />, roles: ['admin', 'owner', 'kasir'] },
    ],
  },
  {
    label: 'Data',
    items: [
      { path: '/products', label: 'Master Data', icon: <InventoryIcon />, roles: ['admin', 'owner', 'staff'] },
      { path: '/karyawan', label: 'Karyawan', icon: <PeopleIcon />, roles: ['admin', 'owner', 'developer'] },
    ],
  },
  {
    label: 'Operasional',
    items: [
      { path: '/locations', label: 'Lokasi', icon: <PlaceIcon />, roles: ['admin', 'owner'] },
      { path: '/jadwal', label: 'Jadwal', icon: <CalendarMonthIcon />, roles: ['admin', 'owner', 'kasir', 'staff', 'developer'] },
      { path: '/vouchers', label: 'Voucher', icon: <LocalOfferIcon />, roles: ['admin', 'owner'] },
      { path: '/kasbon', label: 'Kasbon', icon: <CreditScoreIcon />, roles: ['admin', 'owner', 'kasir'] },
    ],
  },
  {
    label: 'Analitik',
    items: [
      { path: '/reports', label: 'Laporan', icon: <AssessmentIcon />, roles: ['admin', 'owner', 'kasir', 'staff'] },
    ],
  },
];

const SETTINGS_ITEM = { path: '/settings', label: 'Pengaturan', icon: <SettingsIcon />, roles: ['admin', 'developer'] };

export default function CollapsibleSidebar() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const location = useLocation();
  const navigate = useNavigate();

  const { collapsed, toggle, mobileOpen, setMobileOpen, badges } = useSidebarStore();
  const { user, logout } = useAuthStore();
  const { mode, toggleMode } = useThemeStore();

  const drawerWidth = collapsed && isDesktop ? COLLAPSED_WIDTH : EXPANDED_WIDTH;
  const isCollapsed = collapsed && isDesktop;

  // Ctrl+B keyboard shortcut
  useEffect(() => {
    const handler = (e) => {
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);

  // Close mobile drawer on navigation
  const handleNav = useCallback((path) => {
    navigate(path);
    if (!isDesktop) setMobileOpen(false);
  }, [navigate, isDesktop, setMobileOpen]);

  const getBadge = (path) => {
    const val = badges[path];
    if (val == null) return { badge: 0, badgeType: 'none' };
    if (val === 'dot') return { badge: 1, badgeType: 'dot' };
    return { badge: val, badgeType: 'count' };
  };

  const filterByRole = (items) => items.filter((item) => item.roles.includes(user?.role));

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', px: isCollapsed ? 1 : 2, py: 1.5, minHeight: 56 }}>
        <StorefrontIcon sx={{ color: colors.sidebarLabelActive, fontSize: 28, flexShrink: 0 }} />
        {!isCollapsed && (
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              color: colors.sidebarLabelActive,
              ml: 1,
              flexGrow: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            TOKO FARZAN
          </Typography>
        )}
        {isDesktop && (
          <Tooltip title={collapsed ? 'Expand (Ctrl+B)' : 'Collapse (Ctrl+B)'} placement="right">
            <IconButton onClick={toggle} size="small" sx={{ color: colors.sidebarLabelInactive, ml: isCollapsed ? 0 : 0 }}>
              {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <Divider sx={{ borderColor: colors.sidebarBorder }} />

      {/* Scrollable nav items */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', py: 1, scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
        {NAV_SECTIONS.map((section, idx) => {
          const visibleItems = filterByRole(section.items);
          if (visibleItems.length === 0) return null;
          return (
            <Box key={section.label}>
              {idx > 0 && (
                isCollapsed ? (
                  <Divider sx={{ my: 1, mx: 1, borderColor: colors.sidebarBorder }} />
                ) : (
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      px: 2,
                      pt: idx === 0 ? 0 : 1.5,
                      pb: 0.5,
                      color: colors.sidebarSection,
                      fontWeight: 600,
                      fontSize: 11,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                    }}
                  >
                    {section.label}
                  </Typography>
                )
              )}
              {idx === 0 && !isCollapsed && (
                <Typography
                  variant="caption"
                  sx={{
                    display: 'block',
                    px: 2,
                    pb: 0.5,
                    color: colors.sidebarSection,
                    fontWeight: 600,
                    fontSize: 11,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                  }}
                >
                  {section.label}
                </Typography>
              )}
              {visibleItems.map((item) => {
                const { badge, badgeType } = getBadge(item.path);
                return (
                  <SidebarItem
                    key={item.path}
                    icon={item.icon}
                    label={item.label}
                    badge={badge}
                    badgeType={badgeType}
                    active={location.pathname === item.path}
                    collapsed={isCollapsed}
                    onPress={() => handleNav(item.path)}
                  />
                );
              })}
            </Box>
          );
        })}
      </Box>

      {/* Pinned Settings */}
      {SETTINGS_ITEM.roles.includes(user?.role) && (
        <>
          <Divider sx={{ borderColor: colors.sidebarBorder }} />
          <Box sx={{ py: 1 }}>
            <SidebarItem
              icon={SETTINGS_ITEM.icon}
              label={SETTINGS_ITEM.label}
              {...getBadge(SETTINGS_ITEM.path)}
              active={location.pathname === SETTINGS_ITEM.path}
              collapsed={isCollapsed}
              onPress={() => handleNav(SETTINGS_ITEM.path)}
            />
          </Box>
        </>
      )}

      {/* User section */}
      <Divider sx={{ borderColor: colors.sidebarBorder }} />
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          px: isCollapsed ? 0.75 : 1.5,
          py: 1,
          gap: 1,
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          flexWrap: isCollapsed ? 'wrap' : 'nowrap',
          bgcolor: colors.sidebarUserBg,
        }}
      >
        {!isCollapsed && (
          <Chip
            icon={<PersonIcon />}
            label={`${user?.full_name || user?.username}`}
            size="small"
            sx={{
              color: colors.sidebarLabelInactive,
              bgcolor: 'var(--bg-elevated)',
              flexGrow: 1,
              justifyContent: 'flex-start',
              '& .MuiChip-icon': { color: colors.sidebarLabelInactive },
              '& .MuiChip-label': { overflow: 'hidden', textOverflow: 'ellipsis' },
            }}
          />
        )}
        <Tooltip title={mode === 'light' ? 'Mode Gelap' : 'Mode Terang'} placement="right">
          <IconButton onClick={toggleMode} size="small" sx={{ color: colors.sidebarIconInactive }}>
            {mode === 'light' ? <DarkModeIcon fontSize="small" /> : <LightModeIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Keluar" placement="right">
          <IconButton onClick={logout} size="small" sx={{ color: colors.sidebarIconInactive }}>
            <LogoutIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );

  const titleBarHeight = window.electronAPI?.isElectron ? 36 : 0;

  const paperSx = {
    width: drawerWidth,
    transition: 'width 200ms cubic-bezier(0,0,0.2,1)',
    overflowX: 'hidden',
    bgcolor: colors.sidebarBg,
    borderRight: `1px solid ${colors.sidebarBorder}`,
    boxSizing: 'border-box',
    top: titleBarHeight,
    height: `calc(100vh - ${titleBarHeight}px)`,
  };

  if (isDesktop) {
    return (
      <Drawer
        variant="permanent"
        open
        PaperProps={{ sx: paperSx }}
        sx={{ width: drawerWidth, flexShrink: 0, transition: 'width 200ms cubic-bezier(0,0,0.2,1)' }}
      >
        {drawerContent}
      </Drawer>
    );
  }

  return (
    <Drawer
      variant="temporary"
      open={mobileOpen}
      onClose={() => setMobileOpen(false)}
      ModalProps={{ keepMounted: true }}
      PaperProps={{ sx: { ...paperSx, width: EXPANDED_WIDTH } }}
    >
      {drawerContent}
    </Drawer>
  );
}
