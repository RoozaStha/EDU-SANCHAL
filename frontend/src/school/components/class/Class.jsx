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
  0% { transform: scale(1); box-shadow: 0 0 0 rgba(25, 118, 210, 0); }
  70% { transform: scale(1.01); box-shadow: 0 0 10px rgba(25, 118, 210, 0.5); }
  100% { transform: scale(1); box-shadow: 0 0 0 rgba(25, 118, 210, 0); }
`;

const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const float = keyframes`
  0% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0px); }
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
          Authorization: `Bearer ${localStorage.getItem("token")}`,
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

      {/* Title - Blue Bar */}
      <Box
        sx={{
          background: "linear-gradient(45deg, #1976d2 30%, #2196f3 90%)",
          color: "white",
          py: 2,
          px: 3,
          mb: 4,
          borderRadius: 2,
          boxShadow: theme.shadows[3],
          position: "relative",
          overflow: "hidden",
          "&:before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: "rgba(255,255,255,0.3)",
            animation: `${gradientFlow} 6s ease infinite`,
            backgroundSize: "200% 200%",
          },
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          sx={{
            textAlign: "center",
            fontWeight: 600,
            letterSpacing: "0.5px",
            textShadow: "0 1px 2px rgba(0,0,0,0.2)",
          }}
        >
          {editMode ? "Edit Class" : "Add New Class"}
        </Typography>
      </Box>

      {/* Form */}
      <Card
        sx={{
          mb: 4,
          borderRadius: 3,
          boxShadow: theme.shadows[4],
          overflow: "visible",
          transition: "all 0.3s ease",
          animation: `${float} 4s ease-in-out infinite`,
          "&:hover": {
            boxShadow: theme.shadows[8],
          },
        }}
      >
        <CardContent>
          <Box component="form" onSubmit={formik.handleSubmit}>
            <Stack spacing={3} sx={{ mb: 1 }}>
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
                helperText={
                  formik.touched.class_text && formik.errors.class_text
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box
                        sx={{
                          animation: `${pulse} 2s infinite`,
                          mr: 1,
                        }}
                      >
                        📚
                      </Box>
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 2,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      boxShadow: theme.shadows[1],
                    },
                    "&.Mui-focused": {
                      boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
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
                error={
                  formik.touched.class_num && Boolean(formik.errors.class_num)
                }
                helperText={
                  formik.touched.class_num && formik.errors.class_num
                }
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Box
                        sx={{
                          animation: `${pulse} 2s infinite`,
                          mr: 1,
                        }}
                      >
                        🔢
                      </Box>
                    </InputAdornment>
                  ),
                  sx: {
                    borderRadius: 2,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      boxShadow: theme.shadows[1],
                    },
                    "&.Mui-focused": {
                      boxShadow: `0 0 0 2px ${theme.palette.primary.light}`,
                    },
                  },
                }}
              />

              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  type="submit"
                  size="large"
                  startIcon={
                    <CheckIcon
                      sx={{
                        animation: `${editMode ? pulse : "none"} 1.5s infinite`,
                      }}
                    />
                  }
                  sx={{
                    py: 1.5,
                    borderRadius: 2,
                    fontWeight: "bold",
                    background: "linear-gradient(45deg, #1976d2 30%, #2196f3 90%)",
                    color: "white",
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 6px rgba(25, 118, 210, 0.3)",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 6px 8px rgba(25, 118, 210, 0.4)",
                      background: "linear-gradient(45deg, #1565c0 30%, #1e88e5 90%)",
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
                      color: theme.palette.text.primary,
                      borderColor: theme.palette.divider,
                      "&:hover": {
                        transform: "translateY(-2px)",
                        boxShadow: theme.shadows[2],
                        backgroundColor: theme.palette.action.hover,
                      },
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </Stack>
            </Stack>
          </Box>
        </CardContent>
      </Card>

      {/* Class List Header */}
      <Box
        sx={{
          background: "linear-gradient(45deg, #1976d2 30%, #2196f3 90%)",
          color: "white",
          py: 1.5,
          px: 3,
          mb: 2,
          borderRadius: 2,
          boxShadow: theme.shadows[3],
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 600,
            letterSpacing: "0.5px",
            textShadow: "0 1px 2px rgba(0,0,0,0.2)",
            display: "flex",
            alignItems: "center",
            "&:after": {
              content: '""',
              flexGrow: 1,
              height: "2px",
              background: "rgba(255,255,255,0.3)",
              ml: 2,
              borderRadius: "2px",
            },
          }}
        >
          Class List
          <Box
            component="span"
            sx={{
              ml: 1,
              px: 1.5,
              py: 0.5,
              background: "rgba(255,255,255,0.2)",
              borderRadius: 1,
              fontSize: "0.9rem",
              fontWeight: 500,
            }}
          >
            {classes.length} Classes
          </Box>
        </Typography>
      </Box>

      {/* Class List */}
      <Stack spacing={2}>
        {classes.map((classItem, index) => (
          <Grow
            in={true}
            key={classItem._id}
            timeout={index * 150}
            style={{ transformOrigin: "top center" }}
          >
            <Card
              variant="outlined"
              sx={{
                borderRadius: 3,
                overflow: "hidden",
                transition: "all 0.3s ease",
                background: hoveredCard === classItem._id
                  ? `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`
                  : theme.palette.background.paper,
                borderColor: theme.palette.divider,
                position: "relative",
                "&:hover": {
                  transform: "translateY(-3px)",
                  boxShadow: theme.shadows[6],
                  animation: `${pulse} 2s ease infinite`,
                },
              }}
              onMouseEnter={() => setHoveredCard(classItem._id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: "6px",
                  background: "linear-gradient(to bottom, #1976d2, #2196f3)",
                }}
              />
              <CardContent
                sx={{
                  pl: 3,
                  pr: 2,
                  py: 2,
                  "&:last-child": {
                    pb: 2,
                  },
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Box
                      sx={{
                        width: "14px",
                        height: "14px",
                        borderRadius: "50%",
                        background: theme.palette.primary.main,
                        mr: 2,
                        boxShadow: `0 0 8px ${theme.palette.primary.light}`,
                      }}
                    />
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 600,
                        color: theme.palette.text.primary,
                      }}
                    >
                      {classItem.class_text}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      px: 2,
                      py: 0.8,
                      background: "linear-gradient(45deg, #1976d2 30%, #2196f3 90%)",
                      color: "white",
                      borderRadius: 2,
                      fontSize: "0.9rem",
                      fontWeight: 700,
                      boxShadow: theme.shadows[1],
                      animation: `${float} 3s ease-in-out infinite`,
                    }}
                  >
                    Grade {classItem.class_num}
                  </Box>
                </Box>
              </CardContent>
              <CardActions
                sx={{
                  justifyContent: "flex-end",
                  background: theme.palette.action.hover,
                  borderTop: `1px solid ${theme.palette.divider}`,
                  py: 0,
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
                        color: "white",
                        transform: "scale(1.1)",
                        boxShadow: theme.shadows[2],
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
                        color: "white",
                        transform: "scale(1.1)",
                        boxShadow: theme.shadows[2],
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