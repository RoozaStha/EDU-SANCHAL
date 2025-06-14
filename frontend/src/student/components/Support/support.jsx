import React from "react";
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
  Avatar,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import {
  School,
  Assignment,
  Grade,
  Help,
  Schedule,
  Email,
  Chat,
  Group,
  FilterList,
  Search,
  Close,
  Notifications,
  CalendarToday,
  Announcement,
} from "@mui/icons-material";

const StudentSupport = () => {
  return (
    <Box sx={{ backgroundColor: "background.default", color: "text.primary" }}>
      <Box sx={{ maxWidth: 1200, mx: "auto", px: 3, py: 5 }}>
        {/* Page Header */}
        <Box component="header" sx={{ textAlign: "center", mb: 4 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: "bold",
              color: "primary.main",
              mb: 1,
            }}
          >
            Student Support Center
          </Typography>
          <Typography variant="subtitle1" color="text.secondary">
            Resources and help for navigating your school management system
          </Typography>
        </Box>

        {/* Quick Guides Section */}
        <Box component="section" sx={{ mt: 5 }} aria-labelledby="guides-section">
          <Typography
            id="guides-section"
            variant="h5"
            sx={{ fontWeight: "medium", color: "primary.main", mb: 2 }}
          >
            System Quick Guides
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "medium", color: "primary.main", mb: 1 }}
                  >
                    <Assignment sx={{ verticalAlign: "middle", mr: 1 }} />
                    Login & Dashboard
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Learn how to access your account and navigate the dashboard
                  </Typography>
                  <Button
                    variant="text"
                    color="primary"
                    endIcon="→"
                    sx={{ textTransform: "none" }}
                  >
                    Watch Tutorial
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "medium", color: "primary.main", mb: 1 }}
                  >
                    <Assignment sx={{ verticalAlign: "middle", mr: 1 }} />
                    Assignment Submission
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Step-by-step guide to submitting assignments online
                  </Typography>
                  <Button
                    variant="text"
                    color="primary"
                    endIcon="→"
                    sx={{ textTransform: "none" }}
                  >
                    Read Guide
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "medium", color: "primary.main", mb: 1 }}
                  >
                    <Grade sx={{ verticalAlign: "middle", mr: 1 }} />
                    Grade Tracking
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    How to check your grades and understand the grading system
                  </Typography>
                  <Button
                    variant="text"
                    color="primary"
                    endIcon="→"
                    sx={{ textTransform: "none" }}
                  >
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* FAQ Section */}
        <Box component="section" sx={{ mt: 5 }} aria-labelledby="faq-section">
          <Typography
            id="faq-section"
            variant="h5"
            sx={{ fontWeight: "medium", color: "primary.main", mb: 2 }}
          >
            Frequently Asked Questions
          </Typography>
          <Box sx={{ "& .MuiAccordion-root": { mb: 1 } }}>
            <Accordion>
              <AccordionSummary expandIcon="↓" aria-controls="panel1-content">
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
            <Accordion>
              <AccordionSummary expandIcon="↓" aria-controls="panel2-content">
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
            <Accordion>
              <AccordionSummary expandIcon="↓" aria-controls="panel3-content">
                <Typography sx={{ fontWeight: "medium" }}>
                  How do I join an online class?
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary">
                  Links for online classes appear in your timetable 15 minutes before the scheduled
                  time. Click the link to join.
                </Typography>
              </AccordionDetails>
            </Accordion>
          </Box>
        </Box>

        {/* Technical Support Section */}
        <Box
          component="section"
          sx={{ mt: 5 }}
          aria-labelledby="tech-support-section"
        >
          <Typography
            id="tech-support-section"
            variant="h5"
            sx={{ fontWeight: "medium", color: "primary.main", mb: 2 }}
          >
            Technical Support
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "medium", color: "primary.main", mb: 1 }}
                  >
                    <Chat sx={{ verticalAlign: "middle", mr: 1 }} />
                    Live Chat
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Get instant help from our support team (Available 8AM-8PM)
                  </Typography>
                  <Button variant="contained" color="primary">
                    Start Chat
                  </Button>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography
                    variant="h6"
                    sx={{ fontWeight: "medium", color: "primary.main", mb: 1 }}
                  >
                    <Email sx={{ verticalAlign: "middle", mr: 1 }} />
                    Email Support
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Send us an email and we'll respond within 24 hours
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    href="mailto:support@schoolsystem.edu"
                  >
                    Email Us
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>

        {/* School-Specific Resources */}
        <Box
          component="section"
          sx={{ mt: 5 }}
          aria-labelledby="school-resources-section"
        >
          <Typography
            id="school-resources-section"
            variant="h5"
            sx={{ fontWeight: "medium", color: "primary.main", mb: 2 }}
          >
            School-Specific Resources
          </Typography>
          <Box>
            <Typography variant="body1" color="text.primary" sx={{ mb: 1 }}>
              Select your school:
            </Typography>
            <Select
              fullWidth
              variant="outlined"
              sx={{ maxWidth: 400, mb: 2 }}
              defaultValue=""
            >
              <MenuItem value="">-- Select School --</MenuItem>
              <MenuItem value="school1">Greenwood High School</MenuItem>
              <MenuItem value="school2">Riverside Academy</MenuItem>
              <MenuItem value="school3">Sunshine Public School</MenuItem>
              <MenuItem value="school4">Mountain View College</MenuItem>
            </Select>
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  Select your school to view specific resources, contact information, and policies.
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* Peer Support Section */}
        <Box
          component="section"
          sx={{ mt: 5 }}
          aria-labelledby="peer-support-section"
        >
          <Typography
            id="peer-support-section"
            variant="h5"
            sx={{ fontWeight: "medium", color: "primary.main", mb: 2 }}
          >
            Peer Support Forum
          </Typography>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                sx={{ fontWeight: "medium", color: "primary.main", mb: 1 }}
              >
                <Group sx={{ verticalAlign: "middle", mr: 1 }} />
                Connect with Other Students
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Ask questions, share tips, and get help from fellow students across all schools
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1">Assignment Help</Typography>
                      <Typography variant="caption" color="text.secondary">
                        125 active discussions
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1">Technical Issues</Typography>
                      <Typography variant="caption" color="text.secondary">
                        89 active discussions
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1">Study Tips</Typography>
                      <Typography variant="caption" color="text.secondary">
                        210 active discussions
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              <Button variant="contained" color="primary">
                Visit Student Forum
              </Button>
            </CardContent>
          </Card>
        </Box>

        {/* Emergency Contacts */}
        <Box
          component="section"
          sx={{ mt: 5, pb: 5 }}
          aria-labelledby="emergency-section"
        >
          <Typography
            id="emergency-section"
            variant="h5"
            sx={{ fontWeight: "medium", color: "primary.main", mb: 2 }}
          >
            Important Contacts
          </Typography>
          <Card>
            <CardContent>
              <List>
                <ListItem>
                  <ListItemText
                    primary="IT Help Desk:"
                    secondary="+1 (555) 123-4567 (24/7)"
                    primaryTypographyProps={{ fontWeight: "medium" }}
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText
                    primary="Counseling:"
                    secondary="+1 (555) 987-6543 (8AM-5PM)"
                    primaryTypographyProps={{ fontWeight: "medium" }}
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText
                    primary="Administration:"
                    secondary="admin@schoolsystem.edu"
                    primaryTypographyProps={{ fontWeight: "medium" }}
                  />
                </ListItem>
                <Divider component="li" />
                <ListItem>
                  <ListItemText
                    primary="Crisis Hotline:"
                    secondary="988 (24/7 National Hotline)"
                    primaryTypographyProps={{ fontWeight: "medium" }}
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Box>
      </Box>

     
    </Box>
  );
};

export default StudentSupport;