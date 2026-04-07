import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import { colors } from '../theme/colors';

export default function SidebarItem({ icon, label, badge, badgeType = 'none', active, collapsed, onPress }) {
  const renderIcon = () => {
    if (badgeType === 'none' || !badge) return icon;
    if (badgeType === 'dot' || (badgeType === 'count' && collapsed)) {
      return (
        <Badge variant="dot" color="error" overlap="circular"
          sx={{ '& .MuiBadge-badge': { top: 4, right: 4, minWidth: 8, height: 8 } }}>
          {icon}
        </Badge>
      );
    }
    return (
      <Badge badgeContent={badge} color="error"
        sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 16, minWidth: 16 } }}>
        {icon}
      </Badge>
    );
  };

  return (
    <Tooltip title={label} placement="right" disableHoverListener={!collapsed} arrow>
      <ListItemButton
        onClick={onPress}
        sx={{
          borderRadius: collapsed ? '12px' : '28px',
          mx: collapsed ? 0.75 : 1,
          mb: 0.5,
          px: collapsed ? 1.25 : 2,
          minHeight: 44,
          justifyContent: collapsed ? 'center' : 'flex-start',
          bgcolor: active ? colors.sidebarItemActive : 'transparent',
          '&:hover': { bgcolor: active ? colors.sidebarItemActive : colors.bgElevated },
        }}
      >
        <ListItemIcon
          sx={{
            minWidth: collapsed ? 0 : 36,
            color: active ? colors.sidebarIconActive : colors.sidebarIconInactive,
            justifyContent: 'center',
          }}
        >
          {renderIcon()}
        </ListItemIcon>
        <ListItemText
          primary={label}
          primaryTypographyProps={{ fontSize: 14, fontWeight: active ? 600 : 400 }}
          sx={{
            opacity: collapsed ? 0 : 1,
            width: collapsed ? 0 : 'auto',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            transition: collapsed
              ? 'opacity 100ms ease, width 100ms ease'
              : 'opacity 150ms ease 100ms, width 150ms ease 100ms',
            '& .MuiListItemText-primary': { color: active ? colors.sidebarLabelActive : colors.sidebarLabelInactive },
          }}
        />
        {!collapsed && badgeType === 'count' && badge > 0 && (
          <Badge badgeContent={badge} color="error"
            sx={{ ml: 1, '& .MuiBadge-badge': { position: 'static', transform: 'none', fontSize: 10, height: 18, minWidth: 18 } }}
          />
        )}
      </ListItemButton>
    </Tooltip>
  );
}
