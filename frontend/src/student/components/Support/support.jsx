import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { toast } from "react-toastify";
import axios from "axios";
import {keyframes} from "@emotion/react"
import { 
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  TextField,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Chip,
  Badge,
  Tabs,
  Tab,
  Paper,
  Avatar,
  Stack,
  IconButton
} from "@mui/material";
import {
  School,
  Assignment,
  Help,
  Schedule,
  Email,
  Chat,
  Forum,
  SupportAgent,
  ContactSupport,
  Article,
  QuestionAnswer,
  ExpandMore,
  FilterList,
  Search,
  Download,
  Menu as MenuIcon
} from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import { useChatbot } from "../../../context/ChatbotContext";
import { useMediaQuery } from "@mui/material";

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.03); }
  100% { transform: scale(1); }
`;

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`support-tabpanel-${index}`}
      aria-labelledby={`support-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

function a11yProps(index) {
  return {
    id: `support-tab-${index}`,
    'aria-controls': `support-tabpanel-${index}`,
  };
}

const StudentSupport = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { openChatbot } = useChatbot();
  const [tabValue, setTabValue] = useState(0);
  const [selectedSchool, setSelectedSchool] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [schools, setSchools] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(!isMobile);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("http://localhost:5000/api/school/all", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (response.data && Array.isArray(response.data.data)) {
          setSchools(response.data.data);
        } else {
          setSchools([]);
        }
      } catch (error) {
        console.error("Error fetching schools:", error);
        setError("Failed to load schools. Please try again later.");
        setSchools([]);
      } finally {
        setLoadingSchools(false);
      }
    };

    fetchSchools();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    const result = "Sending...";
    const formDataObj = new FormData(event.target);
    formDataObj.append("access_key", "d206b965-abdc-458e-ac87-6c4e0ac98ca1");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formDataObj,
      });
      const data = await response.json();

      if (data.success) {
        toast.success("Form submitted successfully");
        event.target.reset();
        setFormData({ name: "", email: "", message: "" });
      } else {
        toast.error(data.message || "Error submitting form");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit form. Please try again.");
    }
  };

  const handleOpenChatbot = () => {
    openChatbot();
  };

  const SupportCard = ({ icon, title, description, action, color = "primary" }) => (
    <Card 
      sx={{ 
        height: "100%", 
        borderRadius: 2,
        boxShadow: 3,
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: 4,
          borderLeft: `4px solid ${theme.palette[color].main}`
        }
      }}
    >
      <CardContent sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <Avatar sx={{ 
          backgroundColor: `${theme.palette[color].light}20`, 
          color: theme.palette[color].main,
          mb: 2,
          width: 48,
          height: 48
        }}>
          {icon}
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: "medium", mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
          {description}
        </Typography>
        {action}
      </CardContent>
    </Card>
  );

  return (
    <Box
      sx={{
        width: '100%',
        animation: `${fadeIn} 0.5s ease-out`,
        p: isMobile ? 1 : 3,
        pt: 0
      }}
    >
      {/* Page Header */}
      <Paper
        sx={{
          mb: 3,
          p: 3,
          borderRadius: 2,
          background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
          color: 'white',
          boxShadow: 3
        }}
      >
        <Stack direction={isMobile ? 'column' : 'row'} justifyContent="space-between" alignItems="center">
          <Box>
            <Typography
              variant="h3"
              sx={{
                fontWeight: "bold",
                mb: 1,
              }}
            >
              Student Support Center
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Resources and help for navigating your school management system
            </Typography>
          </Box>
          
          {isMobile && (
            <IconButton
              color="inherit"
              onClick={() => setShowFilters(!showFilters)}
              sx={{ mt: 2, alignSelf: 'flex-end' }}
            >
              <FilterList />
            </IconButton>
          )}
        </Stack>
      </Paper>

      {/* Tabs Navigation */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        variant={isMobile ? "scrollable" : "standard"}
        scrollButtons="auto"
        sx={{ 
          mb: 3,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 2,
          p: 1
        }}
      >
        <Tab 
          icon={<SupportAgent />} 
          label="Quick Guides" 
          {...a11yProps(0)} 
          sx={{ minHeight: 48 }}
        />
        <Tab 
          icon={<QuestionAnswer />} 
          label="FAQs" 
          {...a11yProps(1)} 
          sx={{ minHeight: 48 }}
        />
        <Tab 
          icon={<Forum />} 
          label="Get Help" 
          {...a11yProps(2)} 
          sx={{ minHeight: 48 }}
        />
        <Tab 
          icon={<School />} 
          label="Resources" 
          {...a11yProps(3)} 
          sx={{ minHeight: 48 }}
        />
      </Tabs>

      {/* Tab Content */}
      <TabPanel value={tabValue} index={0}>
        <Typography variant="h5" sx={{ fontWeight: "medium", mb: 2 }}>
          System Quick Guides
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <SupportCard
              icon={<Assignment />}
              title="Login & Dashboard"
              description="Learn how to access your account and navigate the dashboard"
              action={
                <Button
                  variant="outlined"
                  color="primary"
                  endIcon={<Download />}
                  sx={{ alignSelf: 'flex-start', mt: 'auto' }}
                >
                  Download Guide
                </Button>
              }
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <SupportCard
              icon={<Assignment />}
              title="Assignment Submission"
              description="Step-by-step guide to submitting assignments online"
              color="secondary"
              action={
                <Button
                  variant="outlined"
                  color="secondary"
                  endIcon={<Download />}
                  sx={{ alignSelf: 'flex-start', mt: 'auto' }}
                >
                  Download Guide
                </Button>
              }
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <SupportCard
              icon={<Article />}
              title="Exam Registration"
              description="How to register for upcoming examinations"
              color="info"
              action={
                <Button
                  variant="outlined"
                  color="info"
                  endIcon={<Download />}
                  sx={{ alignSelf: 'flex-start', mt: 'auto' }}
                >
                  Download Guide
                </Button>
              }
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <SupportCard
              icon={<ContactSupport />}
              title="Technical Support"
              description="Troubleshooting common technical issues"
              color="success"
              action={
                <Button
                  variant="outlined"
                  color="success"
                  endIcon={<Download />}
                  sx={{ alignSelf: 'flex-start', mt: 'auto' }}
                >
                  Download Guide
                </Button>
              }
            />
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Typography variant="h5" sx={{ fontWeight: "medium", mb: 2 }}>
          Frequently Asked Questions
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                  Account & Access
                </Typography>
                
                <Accordion sx={{ mb: 1, borderRadius: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography sx={{ fontWeight: "medium" }}>
                      How do I reset my password?
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary">
                      Go to the login page and click "Forgot Password." Enter your registered email to
                      receive reset instructions.
                    </Typography>
                  </AccordionDetails>
                </Accordion>
                
                <Accordion sx={{ mb: 1, borderRadius: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography sx={{ fontWeight: "medium" }}>
                      Why can't I access my course materials?
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary">
                      Ensure your enrollment is up-to-date. If problems persist, contact your instructor
                      or administrator.
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" color="primary" sx={{ mb: 2 }}>
                  Technical Issues
                </Typography>
                
                <Accordion sx={{ mb: 1, borderRadius: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography sx={{ fontWeight: "medium" }}>
                      Why can't I see my timetable?
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary">
                      Timetables are usually updated at the beginning of each term. If you still can't
                      see yours, contact your school administrator.
                    </Typography>
                  </AccordionDetails>
                </Accordion>
                
                <Accordion sx={{ mb: 1, borderRadius: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography sx={{ fontWeight: "medium" }}>
                      What should I do if an assignment won't submit?
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" color="text.secondary">
                      Check your file size (max 10MB) and format (PDF/DOC). If issues persist, contact
                      technical support before the deadline.
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <Typography variant="h5" sx={{ fontWeight: "medium", mb: 2 }}>
          Get Support
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <SupportCard
              icon={<Chat />}
              title="Live Chat Support"
              description="Get instant help from our AI assistant (Available 24/7)"
              color="info"
              action={
                <Button
                  variant="contained"
                  color="info"
                  onClick={handleOpenChatbot}
                  sx={{ animation: `${pulse} 2s infinite`, mt: 'auto' }}
                >
                  Start Chat Now
                </Button>
              }
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ height: "100%", borderRadius: 2, boxShadow: 3 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <Avatar sx={{ 
                    backgroundColor: `${theme.palette.warning.light}20`, 
                    color: theme.palette.warning.main
                  }}>
                    <Email />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: "medium" }}>
                    Email Support
                  </Typography>
                </Stack>
                
                <form onSubmit={onSubmit} className="text-left">
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Your Name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Email Address"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Message"
                    name="message"
                    multiline
                    rows={4}
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    color="warning"
                    sx={{ mt: 2 }}
                  >
                    Send Message
                  </Button>
                </form>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <Typography variant="h5" sx={{ fontWeight: "medium", mb: 2 }}>
          School Resources
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <Avatar sx={{ 
                    backgroundColor: `${theme.palette.success.light}20`, 
                    color: theme.palette.success.main
                  }}>
                    <School />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: "medium" }}>
                    School-Specific Resources
                  </Typography>
                </Stack>
                
                <Typography variant="body1" color="text.primary" sx={{ mb: 2 }}>
                  Select your school to access resources:
                </Typography>
                
                {loadingSchools ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : error ? (
                  <Typography color="error" sx={{ mb: 2 }}>
                    {error}
                  </Typography>
                ) : (
                  <>
                    <Select
                      fullWidth
                      variant="outlined"
                      sx={{ mb: 2 }}
                      value={selectedSchool}
                      onChange={(e) => setSelectedSchool(e.target.value)}
                    >
                      <MenuItem value="">-- Select School --</MenuItem>
                      {schools.map((school) => (
                        <MenuItem key={school._id} value={school._id}>
                          {school.school_name}
                        </MenuItem>
                      ))}
                    </Select>
                    
                    {selectedSchool && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
                          Resources for {schools.find(s => s._id === selectedSchool)?.school_name}:
                        </Typography>
                        <List>
                          <ListItem>
                            <ListItemText
                              primary="Student Handbook"
                              secondary={<Button size="small" endIcon={<Download />}>Download PDF</Button>}
                            />
                          </ListItem>
                          <Divider />
                          <ListItem>
                            <ListItemText
                              primary="Academic Calendar"
                              secondary={<Button size="small" endIcon={<Download />}>Download</Button>}
                            />
                          </ListItem>
                          <Divider />
                          <ListItem>
                            <ListItemText
                              primary="IT Support Contacts"
                              secondary="support@school.edu"
                            />
                          </ListItem>
                        </List>
                      </Box>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card sx={{ height: "100%", borderRadius: 2, boxShadow: 3 }}>
              <CardContent>
                <Stack direction="row" alignItems="center" spacing={1} mb={2}>
                  <Avatar sx={{ 
                    backgroundColor: `${theme.palette.error.light}20`, 
                    color: theme.palette.error.main
                  }}>
                    <Help />
                  </Avatar>
                  <Typography variant="h6" sx={{ fontWeight: "medium" }}>
                    Important Contacts
                  </Typography>
                </Stack>
                
                <List>
                  <ListItem>
                    <ListItemText
                      primary="IT Help Desk"
                      secondary="+977-1-4456789 (10AM-5PM)"
                      primaryTypographyProps={{ fontWeight: "medium" }}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Administration"
                      secondary="info@edusanchal.edu"
                      primaryTypographyProps={{ fontWeight: "medium" }}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Crisis Hotline"
                      secondary="988 (24/7 National Hotline)"
                      primaryTypographyProps={{ fontWeight: "medium" }}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Student Services"
                      secondary="studentservices@edusanchal.edu"
                      primaryTypographyProps={{ fontWeight: "medium" }}
                    />
                  </ListItem>
                  <Divider />
                  <ListItem>
                    <ListItemText
                      primary="Financial Aid"
                      secondary="finaid@edusanchal.edu"
                      primaryTypographyProps={{ fontWeight: "medium" }}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>
    </Box>
  );
};

export default StudentSupport;