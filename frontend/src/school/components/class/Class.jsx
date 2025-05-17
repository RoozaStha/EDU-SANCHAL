import { useTheme } from "@mui/material/styles";
import {
  Box,
  Button,
  Stack,
  TextField,
  InputAdornment,
  Typography,
  IconButton,
  Card,
  CardContent,
  CardActions,
  keyframes,
  Grow,
  Slide,
  Zoom,
} from "@mui/material";
import { useFormik } from "formik";
import axios from "axios";
import { baseApi } from "../../../environment";
import React, { useEffect, useState } from "react";
import MessageSnackbar from "../../../basic utility components/snackbar/MessageSnackbar";

// Icons
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CloseIcon from "@mui/icons-material/Close";
import CheckIcon from "@mui/icons-material/Check";
import { classSchema } from "../../../yupSchema/classSchema";

// Animations
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.03); }
  100% { transform: scale(1); }
`;

const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

export default function Class() {
  const theme = useTheme();
  const [classes, setClasses] = useState([]);
  const [editMode, setEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [hoveredCard, setHoveredCard] = useState(null);

  const handleMessageClose = () => {
    setMessage("");
  };

  const formik = useFormik({
    initialValues: {
      class_text: "",
      class_num: "",
    },
    validationSchema: classSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        let response;
        if (editMode) {
          response = await axios.patch(
            `${baseApi}/class/update/${editingId}`,
            values
          );
          setMessage("Class updated successfully");
        } else {
          response = await axios.post(`${baseApi}/class/create`, values);
          setMessage("Class created successfully");
        }

        setMessageType("success");
        resetForm();
        fetchAllClasses();
        setEditMode(false);
        setEditingId(null);
      } catch (error) {
        console.error("Error:", error);
        setMessage(error.response?.data?.message || "An error occurred");
        setMessageType("error");
      }
    },
  });

  const fetchAllClasses = async () => {
    try {
      const response = await axios.get(`${baseApi}/class/all`);
      setClasses(response.data.data);
    } catch (error) {
      console.error("Error fetching classes:", error);
      setMessage("Failed to fetch classes");
      setMessageType("error");
    }
  };

  const handleEdit = (classItem) => {
    setEditMode(true);
    setEditingId(classItem._id);
    formik.setValues({
      class_text: classItem.class_text,
      class_num: classItem.class_num,
    });
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditingId(null);
    formik.resetForm();
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${baseApi}/class/delete/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`, // or however you store your token
        },
      });
      setMessage("Class deleted successfully");
      setMessageType("success");
      fetchAllClasses();
    } catch (error) {
      console.error("Error deleting class:", error);
      setMessage(error.response?.data?.message || "Failed to delete class");
      setMessageType("error");
    }
  };

  useEffect(() => {
    fetchAllClasses();
  }, []);

  return (
    <Box
      sx={{
        maxWidth: 800,
        mx: "auto",
        p: 3,
        animation: `${fadeIn} 0.5s ease-out`,
      }}
    >
      {message && (
        <MessageSnackbar
          message={message}
          messageType={messageType}
          handleClose={handleMessageClose}
        />
      )}

      {/* Title */}
      <Typography
        variant="h3"
        component="h1"
        sx={{
          textAlign: "center",
          mb: 4,
          background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          animation: `${gradientFlow} 6s ease infinite`,
          backgroundSize: "200% 200%",
        }}
      >
        {editMode ? "Edit Class" : "Add New Class"}
      </Typography>

      {/* Form */}
      <Box component="form" onSubmit={formik.handleSubmit}>
        <Stack spacing={3} sx={{ mb: 4 }}>
          <TextField
            fullWidth
            variant="outlined"
            label="Class Name"
            name="class_text"
            value={formik.values.class_text}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.class_text && Boolean(formik.errors.class_text)
            }
            helperText={formik.touched.class_text && formik.errors.class_text}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">📚</InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: theme.shadows[2],
                },
              },
            }}
          />

          <TextField
            fullWidth
            variant="outlined"
            label="Class Number"
            name="class_num"
            type="number"
            value={formik.values.class_num}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.class_num && Boolean(formik.errors.class_num)}
            helperText={formik.touched.class_num && formik.errors.class_num}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">🔢</InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: theme.shadows[2],
                },
              },
            }}
          />

          <Stack direction="row" spacing={2}>
            <Button
              fullWidth
              variant="contained"
              type="submit"
              size="large"
              startIcon={<CheckIcon />}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontWeight: "bold",
                background: theme.palette.primary.main,
                transition: "all 0.3s ease",
                "&:hover": {
                  background: theme.palette.primary.dark,
                  transform: "translateY(-2px)",
                  boxShadow: theme.shadows[4],
                },
              }}
            >
              {editMode ? "Update Class" : "Create Class"}
            </Button>

            {editMode && (
              <Button
                fullWidth
                variant="outlined"
                size="large"
                onClick={cancelEdit}
                startIcon={<CloseIcon />}
                sx={{
                  py: 1.5,
                  borderRadius: 2,
                  fontWeight: "bold",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow: theme.shadows[1],
                  },
                }}
              >
                Cancel
              </Button>
            )}
          </Stack>
        </Stack>
      </Box>

      {/* Class List */}
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
        }}
      >
        Class List
      </Typography>

      <Stack spacing={2}>
        {classes.map((classItem, index) => (
          <Grow in={true} key={classItem._id} timeout={index * 150}>
            <Card
              variant="outlined"
              sx={{
                borderRadius: 2,
                overflow: "hidden",
                transition: "all 0.3s ease",
                animation: `${fadeIn} 0.5s ease-out`,
                "&:hover": {
                  transform: "translateY(-5px)",
                  boxShadow: theme.shadows[4],
                  animation: `${pulse} 2s infinite`,
                },
                background:
                  hoveredCard === classItem._id
                    ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`
                    : theme.palette.background.paper,
                borderColor: theme.palette.divider,
              }}
              onMouseEnter={() => setHoveredCard(classItem._id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <CardContent
                sx={{
                  position: "relative",
                  "&:before": {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: "4px",
                    background: theme.palette.primary.main,
                    borderRadius: "0 4px 4px 0",
                  },
                }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                  }}
                >
                  <Box
                    component="span"
                    sx={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: theme.palette.primary.main,
                      display: "inline-block",
                    }}
                  />
                  {classItem.class_text}
                  <Box
                    component="span"
                    sx={{
                      ml: "auto",
                      px: 1.5,
                      py: 0.5,
                      background: theme.palette.primary.light,
                      color: theme.palette.primary.contrastText,
                      borderRadius: 1,
                      fontSize: "0.8rem",
                      fontWeight: 700,
                    }}
                  >
                    Grade {classItem.class_num}
                  </Box>
                </Typography>
              </CardContent>
              <CardActions
                sx={{
                  justifyContent: "flex-end",
                  background: theme.palette.action.hover,
                  borderTop: `1px solid ${theme.palette.divider}`,
                }}
              >
                <Zoom in={hoveredCard === classItem._id || !hoveredCard}>
                  <IconButton
                    onClick={() => handleEdit(classItem)}
                    color="primary"
                    sx={{
                      transition: "all 0.3s ease",
                      "&:hover": {
                        background: theme.palette.primary.main,
                        color: theme.palette.primary.contrastText,
                        transform: "scale(1.1)",
                      },
                    }}
                  >
                    <EditIcon />
                  </IconButton>
                </Zoom>
                <Zoom in={hoveredCard === classItem._id || !hoveredCard}>
                  <IconButton
                    onClick={() => handleDelete(classItem._id)}
                    color="error"
                    sx={{
                      transition: "all 0.3s ease",
                      "&:hover": {
                        background: theme.palette.error.main,
                        color: theme.palette.error.contrastText,
                        transform: "scale(1.1)",
                      },
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Zoom>
              </CardActions>
            </Card>
          </Grow>
        ))}
      </Stack>
    </Box>
  );
}
