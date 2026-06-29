'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Box,
    Drawer,
    AppBar,
    Toolbar,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Collapse,
    IconButton,
    Typography,
    Avatar,
    Menu,
    MenuItem,
    Divider,
    useTheme,
    useMediaQuery,
    Stack,
    Fade
} from '@mui/material';
import {
    ExpandLess,
    ExpandMore,
    Settings as SettingsIcon,
    ExitToApp as LogoutIcon
} from '@mui/icons-material';
import {
    DataUsage24Regular,
    Food24Regular,
    Person24Regular,
    StarEmphasis24Regular,
    QrCode24Regular,
    Sparkle24Regular,
    ContentViewGallery24Regular,
    People24Regular,
    Cart24Regular,
    ArrowClockwise24Regular,
    Circle12Regular
} from '@fluentui/react-icons';
import instanceV1 from '@/app/(admin)/component/restaurant/authaxios';
import packageJson from '@/package.json';

// Custom SVG Icons for Header/AppBar (not sidebar)
import { MenuSvg } from '@/public/assets/icon/menuSvg';
import { EatCollapse, Eats } from '@/public/assets/icon/Eats';

const menuConfig = [
    { label: 'Insights', path: '/dashboard/insight', icon: <DataUsage24Regular /> },
    {
        label: 'Eatery Management',
        icon: <Food24Regular />,
        children: [
            { label: 'Onboard New Eatery', path: '/onboarding' },
            { label: 'List Eatery', path: '/list-restaurants' },
            { label: 'List Employees', path: '/users/employees' },
        ],
    },
    { label: 'List Customers', path: '/users/customers', icon: <Person24Regular /> },
    { label: 'Recommendation', path: '/recommendations', icon: <StarEmphasis24Regular /> },
    { label: 'Eatshot', path: '/eatshot', icon: <QrCode24Regular /> },
    { label: 'AI Generation', path: '/ai-image-gen', icon: <Sparkle24Regular /> },
    {
        label: 'Data Moderator',
        icon: <ContentViewGallery24Regular />,
        children: [
            { label: 'Cafe Gallery', path: '/restaurants/gallery' },
            { label: 'Instagram', path: '/integrations/instagram' },
        ],
    },
    {
        label: 'Team Member',
        icon: <People24Regular />,
        children: [
            { label: 'Team', path: '/team' },
            { label: 'Team Role', path: '/team/roles' },
        ],
    },
    {
        label: 'Marketing',
        icon: <ContentViewGallery24Regular />,
        children: [
            { label: 'List Routes', path: '/system/routes' },
            { label: 'List Conditions', path: '/system/conditions' },
            { label: 'List Banner Placement', path: '/banners/placements' },
            { label: 'List Banners', path: '/banners' },
            { label: 'Notification Campaigns', path: '/notifications/campaign' },
            { label: 'Notification Template', path: '/notifications/templates' },
            { label: 'Notification History', path: '/notifications/history' },
        ],
    },
    {
        label: 'Gamification',
        icon: <ContentViewGallery24Regular />,
        children: [
            { label: 'Contributions', path: '/gamification/contributions' },
            { label: 'Milestones', path: '/gamification/milestones' },
            { label: 'Levels', path: '/gamification/levels' },
        ],
    },
    {
        label: 'Food Menu',
        icon: <ContentViewGallery24Regular />,
        children: [
            { label: 'Universal Category', path: '/catalog/categories' },
            { label: 'Universal Item', path: '/catalog/items' },
            { label: 'Restaurant Menu', path: '/restaurants/menu' },
            { label: 'Restaurant Combos', path: '/restaurants/combos' },
            { label: 'Explore Food', path: '/catalog/explore' },
        ],
    },
    {
        label: 'QR Management',
        icon: <QrCode24Regular />,
        children: [
            { label: 'QR Management', path: '/qr/management' },
            { label: 'Table Management', path: '/restaurants/tables' },
        ],
    },
    {
        label: 'Live Orders',
        icon: <Cart24Regular />,
        children: [
            { label: 'Live Orders', path: '/orders/live' },
            { label: 'Order History', path: '/orders/history' },
        ],
    },
    { label: 'Released Log', path: '/released-log', icon: <ArrowClockwise24Regular /> },
];

export default function AdminLayout({ children }) {
    const theme = useTheme();
    const pathname = usePathname();
    const router = useRouter();

    const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
    const [drawerOpen, setDrawerOpen] = useState(true);
    const [expandedMenus, setExpandedMenus] = useState({});
    const [profileAnchor, setProfileAnchor] = useState(null);

    const [userData, setUserData] = useState({
        firstName: 'Admin',
        lastName: '',
        roleName: '',
        profilePic: ''
    });

    // Sync drawer states
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('drawerOpen');
            if (saved !== null) {
                setDrawerOpen(saved === 'true');
            }
        }
    }, []);

    // Fetch roles and profile info
    useEffect(() => {
        const fetchProfileAndRoles = async () => {
            try {
                const token = localStorage.getItem('authToken');
                if (!token) return;

                const firstName = localStorage.getItem('firstName') || 'Admin';
                const lastName = localStorage.getItem('lastName') || '';
                const userRoleId = Number(localStorage.getItem('userRole'));
                const profilePicId = localStorage.getItem('profile_pic_image_id');

                const profilePicUrl = profilePicId && !profilePicId.startsWith('/')
                    ? `${process.env.NEXT_PUBLIC_VITE_REACT_APP_IMAGE_DELIVERY_URL}${profilePicId}/public`
                    : profilePicId;

                // Fetch all roles to map name
                const instance = instanceV1(token);
                const res = await instance.get('/api/admin/role/v1/public');

                let mappedRoleName = '';
                if (res?.data?.status && Array.isArray(res.data.all_roles)) {
                    const roleObj = res.data.all_roles.find(r => Number(r.id) === userRoleId);
                    if (roleObj) {
                        mappedRoleName = roleObj.role_name;
                    }
                }

                setUserData({
                    firstName,
                    lastName,
                    roleName: mappedRoleName,
                    profilePic: profilePicUrl || ''
                });
            } catch (error) {
                console.error('Error fetching roles/profile details:', error);
            }
        };

        fetchProfileAndRoles();
    }, []);

    // Sync expanded menus with active sub-routes
    useEffect(() => {
        const newExpanded = {};
        menuConfig.forEach((item) => {
            if (item.children && item.children.some((child) => isRouteActive(child.path))) {
                newExpanded[item.label] = true;
            }
        });
        setExpandedMenus(newExpanded);
    }, [pathname]);

    const isRouteActive = (path) => {
        const currentPath = pathname.toLowerCase();
        const targetPath = path.toLowerCase();
        return currentPath === targetPath || currentPath.startsWith(targetPath + '/');
    };

    const handleDrawerToggle = () => {
        const newValue = !drawerOpen;
        setDrawerOpen(newValue);
        if (typeof window !== 'undefined') {
            localStorage.setItem('drawerOpen', String(newValue));
        }
    };

    const handleMenuExpandToggle = (label) => {
        setExpandedMenus((prev) => ({ ...prev, [label]: !prev[label] }));
    };

    const handleProfileMenuOpen = (e) => setProfileAnchor(e.currentTarget);
    const handleProfileMenuClose = () => setProfileAnchor(null);

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('firstName');
        localStorage.removeItem('lastName');
        localStorage.removeItem('userRole');
        localStorage.removeItem('profile_pic_image_id');
        localStorage.removeItem('email');
        localStorage.removeItem('mobile_number');
        localStorage.removeItem('api_key');
        document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        router.push('/');
    };

    // Sidebar List Content
    const sidebarContent = (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', minHeight: 0 }}>
            {/* Drawer Navigation List */}
            <Box sx={{ flexGrow: 1, overflowY: 'auto', minHeight: 0, px: 1, py: 1 }}>
                <List sx={{ p: 0, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {menuConfig.map((item) => {
                        const hasChildren = !!item.children;
                        const isExpanded = !!expandedMenus[item.label];

                        if (hasChildren) {
                            const hasActiveChild = item.children.some(child => isRouteActive(child.path));

                            return (
                                <React.Fragment key={item.label}>
                                    <ListItem disablePadding>
                                        <ListItemButton
                                            onClick={() => handleMenuExpandToggle(item.label)}
                                            selected={hasActiveChild}
                                            sx={{
                                                '& svg path': { fill: 'currentColor' }
                                            }}
                                        >
                                            <ListItemIcon>
                                                {item.icon}
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={
                                                    <Typography sx={{ fontSize: '14px', fontWeight: 500 }}>
                                                        {item.label}
                                                    </Typography>
                                                }
                                            />
                                            {isExpanded ? <ExpandLess sx={{ fontSize: 18 }} /> : <ExpandMore sx={{ fontSize: 18 }} />}
                                        </ListItemButton>
                                    </ListItem>
                                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                        <List component="div" disablePadding sx={{ mt: 0.5, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            {item.children.map((child) => {
                                                const active = isRouteActive(child.path);
                                                return (
                                                    <ListItemButton
                                                        key={child.label}
                                                        component={Link}
                                                        href={child.path}
                                                        selected={active}
                                                        sx={{
                                                            pl: 3,
                                                            '& svg path': { fill: 'currentColor' }
                                                        }}
                                                    >
                                                        <ListItemIcon sx={{ minWidth: 20, p: 0, m: 0 }}>
                                                            <Circle12Regular style={{ fontSize: '10px', color: active ? '#FF6F00' : 'inherit' }} />
                                                        </ListItemIcon>
                                                        <ListItemText
                                                            primary={
                                                                <Typography sx={{ fontSize: '14px' }}>
                                                                    {child.label}
                                                                </Typography>
                                                            }
                                                        />
                                                    </ListItemButton>
                                                );
                                            })}
                                        </List>
                                    </Collapse>
                                </React.Fragment>
                            );
                        } else {
                            const active = isRouteActive(item.path);

                            return (
                                <ListItem disablePadding key={item.label}>
                                    <ListItemButton
                                        component={Link}
                                        href={item.path}
                                        selected={active}
                                        sx={{
                                            '& svg path': { fill: 'currentColor' }
                                        }}
                                    >
                                        <ListItemIcon>
                                            {item.icon}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={
                                                <Typography sx={{ fontSize: '14px', fontWeight: active ? 600 : 500 }}>
                                                    {item.label}
                                                </Typography>
                                            }
                                        />
                                    </ListItemButton>
                                </ListItem>
                            );
                        }
                    })}
                </List>
            </Box>

            {/* Drawer bottom info */}
            <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '11px', display: 'block' }}>
                    UI Version {packageJson.version}
                </Typography>
            </Box>
        </Box>
    );

    return (
        <Box sx={{ minHeight: '100vh', backgroundColor: '#F7FAF7' }}>
            {/* App Bar floats at the top of the page */}
            <AppBar position="sticky" elevation={0} sx={{ top: '16px', m: 2, zIndex: 1100, width: 'calc(100% - 32px)' }}>
                <Toolbar>
                    <IconButton aria-label="open drawer" edge="start" onClick={handleDrawerToggle}>
                        <MenuSvg />
                    </IconButton>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ ml: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <EatCollapse />
                        <Eats />
                    </Stack>
                    <Box sx={{ marginLeft: 'auto' }}>
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                cursor: 'pointer',
                            }}
                            onClick={handleProfileMenuOpen}
                        >
                            <Avatar
                                src={userData.profilePic || undefined}
                                alt={`${userData.firstName} ${userData.lastName}`}
                                sx={{ width: 45, height: 45, marginRight: 1 }}
                            >
                                {!userData.profilePic && userData.firstName.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box
                                sx={{
                                    display: { xs: 'none', md: 'flex' },
                                    flexDirection: 'column',
                                }}
                            >
                                <Typography
                                    fontSize="14px"
                                    sx={{
                                        mr: '5px',
                                        color: '#6e6b7b',
                                        fontWeight: 500,
                                    }}
                                >
                                    {userData.firstName}&nbsp;{userData.lastName}
                                </Typography>
                                {userData.roleName && (
                                    <Typography
                                        fontSize={12}
                                        sx={{
                                            mr: '5px',
                                            color: '#6e6b7b',
                                        }}
                                    >
                                        {userData.roleName}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    </Box>
                </Toolbar>
            </AppBar>

            {/* Mobile Drawer */}
            {!isDesktop && (
                <Drawer
                    variant="temporary"
                    open={drawerOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                >
                    {sidebarContent}
                </Drawer>
            )}

            {/* Desktop Drawer */}
            {isDesktop && (
                <Drawer
                    variant="persistent"
                    open={drawerOpen}
                    anchor="left"
                >
                    {sidebarContent}
                </Drawer>
            )}

            {/* Mobile Backdrop Fade */}
            <Fade in={drawerOpen && !isDesktop} timeout={300} mountOnEnter unmountOnExit>
                <div
                    onClick={() => setDrawerOpen(false)}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        zIndex: 1198,
                    }}
                />
            </Fade>

            {/* Content wrapper */}
            <Box sx={{ display: 'flex', justifyContent: 'end' }}>
                <Box
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        width: { xs: '100%', lg: (drawerOpen && isDesktop) ? 'calc(100vw - 285px)' : '100%' },
                        transition: 'width 0.2s ease',
                        p: 0,
                    }}
                >
                    {/* Main child content */}
                    <Box sx={{ flexGrow: 1, py: 2 }}>
                        {children}
                    </Box>
                </Box>
            </Box>

            {/* User Profile Dropdown Menu */}
            <Menu
                anchorEl={profileAnchor}
                open={Boolean(profileAnchor)}
                onClose={handleProfileMenuClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                PaperProps={{
                    elevation: 3,
                    sx: {
                        mt: 1.5,
                        minWidth: '200px',
                        borderRadius: '12px',
                        border: '1px solid rgba(0, 74, 0, 0.08)',
                        p: 0.5
                    }
                }}
            >
                <MenuItem
                    onClick={() => {
                        handleProfileMenuClose();
                        router.push('/AccountSetting');
                    }}
                    sx={{ borderRadius: '8px', py: 1, gap: 1.5 }}
                >
                    <SettingsIcon fontSize="small" sx={{ color: '#666666' }} />
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        Account Setting
                    </Typography>
                </MenuItem>

                <Divider sx={{ my: 0.5, borderColor: 'rgba(0, 74, 0, 0.08)' }} />

                <MenuItem
                    onClick={() => {
                        handleProfileMenuClose();
                        handleLogout();
                    }}
                    sx={{ borderRadius: '8px', py: 1, gap: 1.5, color: '#D32F2F' }}
                >
                    <LogoutIcon fontSize="small" />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        Logout
                    </Typography>

                </MenuItem>
            </Menu>
        </Box>
    );
}
