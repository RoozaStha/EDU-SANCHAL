import * as React from 'react';
import { useContext } from 'react';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import { useNavigate } from 'react-router-dom';
import { styled } from '@mui/material/styles';
import { AuthContext } from '../../../context/AuthContext';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  boxShadow: theme.shadows[1],
  borderBottom: `1px solid ${theme.palette.divider}`,
  color: theme.palette.text.primary,
}));

const StyledButton = styled(Button)(({ theme }) => ({
  color: theme.palette.text.primary,
  fontSize: '16px',
  textTransform: 'none',
  fontWeight: 500,
  padding: '8px 20px',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
    zIndex: 0,
    opacity: 0,
    transform: 'translateY(100%)',
    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  '&:hover': {
    color: theme.palette.primary.contrastText,
    transform: 'translateY(-2px)',
    boxShadow: `0 4px 12px rgba(${theme.palette.primary.main}, 0.2)`,
    '&:before': {
      opacity: 1,
      transform: 'translateY(0)',
    }
  },
  '& span': {
    position: 'relative',
    zIndex: 1,
  }
}));

const LogoImage = styled('img')({
  height: 48,
  marginRight: 12,
  transition: 'transform 0.3s ease',
  '&:hover': {
    transform: 'rotate(-5deg) scale(1.05)',
  },
});

const LogoText = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  color: theme.palette.text.primary,
  fontSize: '1.75rem',
  letterSpacing: '-0.5px',
  '& span': {
    color: theme.palette.secondary.main,
    fontWeight: 400,
  }
}));

const Navbar = () => {
  const { user, authenticated } = useContext(AuthContext);
  const [pages, setPages] = React.useState([
    { link: '/', component: 'Home' },
    { link: '/login', component: 'Login' },
    { link: '/register', component: 'Register' }
  ]);
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (authenticated && user?.role) {
      setPages([
        { link: "/", component: "Home" },
        { link: "/logout", component: "Log Out" },
        { link: `/${user.role.toLowerCase()}`, component: "Dashboard" },
      ]);
    } else {
      setPages([
        { link: '/', component: 'Home' },
        { link: '/login', component: 'Login' },
        { link: '/register', component: 'Register' }
      ]);
    }
  }, [authenticated, user]);

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = (link) => {
    setAnchorElNav(null);
    if (link) navigate(link);
  };

  return (
    <StyledAppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ py: 1, gap: 4 }}>
          {/* Logo Section */}
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              cursor: 'pointer',
              '&:hover': {
                '& .LogoText': {
                  color: (theme) => theme.palette.primary.main
                }
              }
            }}
            onClick={() => navigate('/')}
          >
            <LogoImage src="/logo.png" alt="EDU-SANCHAL" />
            <LogoText variant="h1" className="LogoText">
              EDU<span>SANCHAL</span>
              <Typography 
                component="div" 
                variant="caption" 
                sx={{ 
                  display: 'block',
                  color: 'text.secondary',
                  fontSize: '0.75rem',
                  letterSpacing: '0.5px',
                  lineHeight: 1.2
                }}
              >
                Education Empowerment Platform
              </Typography>
            </LogoText>
          </Box>

          {/* Desktop Menu */}
          <Box sx={{ 
            display: { xs: 'none', md: 'flex' }, 
            gap: 1,
            alignItems: 'center',
            ml: 'auto'
          }}>
            {pages.map((page, i) => (
              <StyledButton key={i} onClick={() => handleCloseNavMenu(page.link)}>
                <span>{page.component}</span>
              </StyledButton>
            ))}
          </Box>

          {/* Mobile Menu Button */}
          <IconButton
            size="large"
            onClick={handleOpenNavMenu}
            sx={{ 
              display: { xs: 'flex', md: 'none' },
              ml: 'auto',
              color: 'primary.main'
            }}
          >
            <MenuIcon />
          </IconButton>

          {/* Mobile Menu */}
          <Menu
            anchorEl={anchorElNav}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorElNav)}
            onClose={() => handleCloseNavMenu(null)}
            sx={{ 
              '& .MuiPaper-root': {
                minWidth: 200,
                boxShadow: 4,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                backgroundColor: 'background.paper'
              }
            }}
          >
            {pages.map((page, i) => (
              <MenuItem 
                key={i} 
                onClick={() => handleCloseNavMenu(page.link)}
                sx={{
                  py: 1.5,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: 'rgba(0, 0, 0, 0.04)',
                    paddingLeft: 3
                  }
                }}
              >
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontWeight: 500,
                    background: (theme) => 
                      `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent'
                  }}
                >
                  {page.component}
                </Typography>
              </MenuItem>
            ))}
          </Menu>
        </Toolbar>
      </Container>
    </StyledAppBar>
  );
};

export default Navbar;