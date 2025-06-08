import { Box, Container, Grid, Typography, Link, TextField, Button, Divider, Tooltip } from "@mui/material";
import { 
  Facebook, Twitter, Instagram, LinkedIn, YouTube, 
  School, People, Class, Assignment, Grade, Event, 
  Email, Phone, Schedule, LocationOn 
} from "@mui/icons-material";
import { styled } from "@mui/system";
import { motion } from "framer-motion";

// Styled components
const FooterContainer = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.dark,
  color: '#ffffff',
  padding: theme.spacing(4, 0),
  borderTop: `1px solid ${theme.palette.divider}`,
}));

const FooterTitle = styled(Typography)(({ theme }) => ({
  fontWeight: 600,
  marginBottom: theme.spacing(1.5),
  fontSize: '1rem',
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  '& svg': {
    color: theme.palette.secondary.main
  }
}));

const FooterLink = styled(Link)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(1),
  marginBottom: theme.spacing(1),
  textDecoration: 'none',
  fontSize: '0.875rem',
  transition: 'all 0.2s ease',
  '&:hover': {
    color: theme.palette.secondary.main,
    transform: 'translateX(3px)'
  },
  '& svg': {
    fontSize: '0.9rem'
  }
}));

const SocialIcon = styled(motion.div)(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 32,
  height: 32,
  borderRadius: '50%',
  backgroundColor: 'rgba(255,255,255,0.08)',
  color: '#ffffff',
  transition: 'all 0.3s ease',
  marginRight: theme.spacing(1),
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: theme.palette.secondary.main,
  }
}));

const NewsletterInput = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: theme.palette.background.paper,
    '& fieldset': {
      borderColor: 'rgba(255,255,255,0.1)'
    },
    '&:hover fieldset': {
      borderColor: theme.palette.secondary.main
    }
  },
  '& .MuiInputBase-input': {
    padding: theme.spacing(1),
    fontSize: '0.875rem'
  }
}));

const SubscribeButton = styled(Button)(({ theme }) => ({
  marginTop: theme.spacing(1),
  fontWeight: 500,
  padding: theme.spacing(1),
  fontSize: '0.875rem',
  textTransform: 'none',
  boxShadow: 'none',
  '&:hover': {
    boxShadow: `0 2px 8px ${theme.palette.secondary.main}33`
  }
}));

const socialLinks = [
  { icon: <Facebook />, name: 'Facebook', color: '#1877F2' },
  { icon: <Twitter />, name: 'Twitter', color: '#1DA1F2' },
  { icon: <Instagram />, name: 'Instagram', color: '#E4405F' },
  { icon: <LinkedIn />, name: 'LinkedIn', color: '#0A66C2' },
  { icon: <YouTube />, name: 'YouTube', color: '#FF0000' },
];

const quickLinks = [
  { icon: <People />, text: 'Students', href: '#' },
  { icon: <Class />, text: 'Classes', href: '#' },
  { icon: <Assignment />, text: 'Assignments', href: '#' },
  { icon: <Grade />, text: 'Grades', href: '#' },
  { icon: <Event />, text: 'Calendar', href: '#' },
];

export default function Footer() {
  return (
    <FooterContainer component="footer">
      <Container maxWidth="lg" disableGutters sx={{ px: { xs: 2, md: 3 } }}>
        <Grid container spacing={3}>
          {/* School Info */}
          <Grid item xs={12} md={4}>
            <FooterTitle variant="h6">
              <School />
              EDUSANCHAL
            </FooterTitle>
            <Typography variant="body2" color="inherit" paragraph sx={{ fontSize: '0.875rem', opacity: 0.9 }}>
              Comprehensive school management system for administrators, teachers, and students.
            </Typography>
            
            <Box sx={{ display: 'flex', mt: 1.5 }}>
              {socialLinks.map((social) => (
                <Tooltip key={social.name} title={social.name} arrow>
                  <SocialIcon 
                    whileHover={{ scale: 1.1, backgroundColor: social.color }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {social.icon}
                  </SocialIcon>
                </Tooltip>
              ))}
            </Box>
          </Grid>

          {/* Quick Links */}
          <Grid item xs={6} md={2}>
            <FooterTitle variant="subtitle1">Quick Links</FooterTitle>
            {quickLinks.map((link) => (
              <FooterLink 
                key={link.text} 
                href={link.href} 
                color="inherit" 
                underline="none"
                sx={{ opacity: 0.9 }}
              >
                {link.icon}
                {link.text}
              </FooterLink>
            ))}
          </Grid>

          {/* Contact Info */}
          <Grid item xs={6} md={3}>
            <FooterTitle variant="subtitle1">Contact</FooterTitle>
            <FooterLink href="mailto:info@edusanchal.edu" color="inherit" underline="none" sx={{ opacity: 0.9 }}>
              <Email />
              info@edusanchal.edu
            </FooterLink>
            <FooterLink href="tel:+97714456789" color="inherit" underline="none" sx={{ opacity: 0.9 }}>
              <Phone />
              +977-1-4456789
            </FooterLink>
            <FooterLink href="#" color="inherit" underline="none" sx={{ opacity: 0.9 }}>
              <LocationOn />
              Kathmandu, Nepal
            </FooterLink>
            <FooterLink href="#" color="inherit" underline="none" sx={{ opacity: 0.9 }}>
              <Schedule />
              Sun-Fri: 10AM - 5PM
            </FooterLink>
          </Grid>

          {/* Newsletter */}
          <Grid item xs={12} md={3}>
            <FooterTitle variant="subtitle1">Stay Updated</FooterTitle>
            <Typography variant="body2" color="inherit" paragraph sx={{ fontSize: '0.875rem', opacity: 0.9 }}>
              Subscribe to our newsletter for the latest updates and announcements.
            </Typography>
            <Box component="form">
              <NewsletterInput
                fullWidth
                size="small"
                placeholder="Your email"
                variant="outlined"
              />
              <SubscribeButton
                type="submit"
                variant="contained"
                color="secondary"
                fullWidth
                disableElevation
              >
                Subscribe
              </SubscribeButton>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ 
          my: 3, 
          backgroundColor: 'rgba(255,255,255,0.1)',
        }} />

        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', md: 'row' }, 
          justifyContent: 'space-between', 
          alignItems: 'center',
          gap: 1,
          fontSize: '0.75rem'
        }}>
          <Typography variant="body2" color="inherit" sx={{ opacity: 0.8, fontSize: '0.75rem' }}>
            © {new Date().getFullYear()} EDUSANCHAL. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Link href="#" color="inherit" variant="body2" underline="hover" sx={{ fontSize: '0.75rem', opacity: 0.8 }}>
              Privacy
            </Link>
            <Link href="#" color="inherit" variant="body2" underline="hover" sx={{ fontSize: '0.75rem', opacity: 0.8 }}>
              Terms
            </Link>
            <Link href="#" color="inherit" variant="body2" underline="hover" sx={{ fontSize: '0.75rem', opacity: 0.8 }}>
              Help Center
            </Link>
          </Box>
        </Box>
      </Container>
    </FooterContainer>
  );
}