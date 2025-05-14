import { useTheme, keyframes } from "@mui/material/styles";
import {
  Box,
  Stack,
  Typography,
  Card,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  InputAdornment
} from "@mui/material";
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import axios from "axios";
import { baseApi } from "../../../environment";
import React, { useEffect, useState } from "react";

// Icons
import EventIcon from "@mui/icons-material/Event";
import SubjectIcon from "@mui/icons-material/Subject";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ClassIcon from "@mui/icons-material/Class";

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

export default function ExaminationTeacher() {
  const theme = useTheme();
  const [examinations, setExaminations] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [loading, setLoading] = useState(true);
  const [hoveredCard, setHoveredCard] = useState(null);

  const fetchAllClasses = async () => {
    try {
      const response = await axios.get(`${baseApi}/class/all`);
      setClasses(response.data.data);
      
      if (response.data.data.length > 0 && !selectedClass) {
        setSelectedClass(response.data.data[0]._id);
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchExaminationsByClass = async (classId) => {
    if (!classId) return;
    
    try {
      setLoading(true);
      const response = await axios.get(`${baseApi}/examination/class/${classId}`);
      setExaminations(response.data.examinations);
    } catch (error) {
      console.error("Error fetching examinations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClassChange = (event) => {
    const classId = event.target.value;
    setSelectedClass(classId);
    fetchExaminationsByClass(classId);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No date set";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  useEffect(() => {
    fetchAllClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchExaminationsByClass(selectedClass);
    }
  }, [selectedClass]);

  return (
    <Box
      sx={{
        maxWidth: 800,
        mx: "auto",
        p: 3,
        animation: `${fadeIn} 0.5s ease-out`,
      }}
    >
      {/* Title */}
      <Typography
        variant="h4"
        component="h1"
        sx={{
          textAlign: "center",
          mb: 4,
          background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          animation: `${gradientFlow} 6s ease infinite`,
          backgroundSize: "200% 200%",
          fontWeight: 700,
          letterSpacing: 1
        }}
      >
        Examination Schedule
      </Typography>

      {/* Class Selector */}
      <Box sx={{ mb: 4 }}>
        <FormControl fullWidth variant="outlined">
          <InputLabel id="class-select-label">Select Class</InputLabel>
          <Select
            labelId="class-select-label"
            id="class-select"
            value={selectedClass}
            onChange={handleClassChange}
            label="Select Class"
            startAdornment={
              <InputAdornment position="start">
                <ClassIcon color="primary" />
              </InputAdornment>
            }
            sx={{
              borderRadius: 2,
              transition: "all 0.3s ease",
              "&:hover": {
                boxShadow: theme.shadows[2],
              },
              "& .MuiSelect-select": {
                display: "flex",
                alignItems: "center",
                gap: 1
              }
            }}
          >
            {classes.map((classItem) => (
              <MenuItem key={classItem._id} value={classItem._id}>
                {classItem.class_text}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Examinations List */}
      <Box sx={{ mt: 4 }}>
        <Typography
          variant="h5"
          sx={{
            mb: 2,
            position: "relative",
            "&:after": {
              content: '""',
              display: "block",
              width: "60px",
              height: "3px",
              background: theme.palette.primary.main,
              marginTop: "8px",
              borderRadius: "3px",
            },
            fontWeight: 600,
            color: theme.palette.text.primary
          }}
        >
          Upcoming Examinations
        </Typography>

        {loading ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            py: 4,
            alignItems: 'center',
            minHeight: 200
          }}>
            <CircularProgress color="primary" size={60} />
          </Box>
        ) : (
          <Stack spacing={2}>
            {examinations.length > 0 ? (
              examinations.map((exam, index) => (
                <Card
                  key={exam._id}
                  variant="outlined"
                  sx={{
                    borderRadius: 3,
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                    animation: `${fadeIn} 0.5s ease-out ${index * 0.1}s`,
                    "&:hover": {
                      transform: "translateY(-3px)",
                      boxShadow: theme.shadows[4],
                    },
                    background:
                      hoveredCard === exam._id
                        ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`
                        : theme.palette.background.paper,
                    borderColor: theme.palette.divider,
                    position: "relative",
                    borderLeft: `4px solid ${theme.palette.primary.main}`
                  }}
                  onMouseEnter={() => setHoveredCard(exam._id)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <CardContent>
                    <Box sx={{ 
                      display: "flex", 
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1
                    }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          color: theme.palette.primary.dark
                        }}
                      >
                        {exam.subject}
                      </Typography>
                      
                      <Box
                        component="span"
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          background: theme.palette.primary.light,
                          color: theme.palette.primary.contrastText,
                          borderRadius: 1,
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          textTransform: "uppercase",
                          letterSpacing: 0.5
                        }}
                      >
                        {exam.examType}
                      </Box>
                    </Box>
                    
                    <Box sx={{ 
                      display: "flex", 
                      flexWrap: 'wrap',
                      alignItems: "center",
                      gap: 1.5,
                      mt: 1.5
                    }}>
                      <Box sx={{ 
                        display: "flex", 
                        alignItems: "center",
                        gap: 1 
                      }}>
                        <EventIcon fontSize="small" color="primary" />
                        <Typography variant="body2">
                          <strong>Date:</strong> {formatDate(exam.examDate)}
                        </Typography>
                      </Box>
                      
                      <Box sx={{ 
                        display: "flex", 
                        alignItems: "center",
                        gap: 1 
                      }}>
                        <AssignmentIcon fontSize="small" color="primary" />
                        <Typography variant="body2">
                          <strong>Type:</strong> {exam.examType}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Box 
                sx={{ 
                  textAlign: 'center', 
                  py: 4,
                  bgcolor: theme.palette.action.hover,
                  borderRadius: 2,
                  border: `1px dashed ${theme.palette.divider}`,
                  animation: `${fadeIn} 0.5s ease-out`
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  No examinations scheduled for this class
                </Typography>
              </Box>
            )}
          </Stack>
        )}
      </Box>
    </Box>
  );
}