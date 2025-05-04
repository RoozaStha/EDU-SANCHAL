import axios from "axios";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import MessageSnackbar from "../../../basic utility components/snackbar/MessageSnackbar";
import {
  Button,
  Box,
  Typography,
  TextField,
  Stack,
  CircularProgress,
} from "@mui/material";
import CloudUpload from "@mui/icons-material/CloudUpload";
import { styled } from "@mui/material/styles";

const VisuallyHiddenInput = styled("input")({
  clip: "rect(0 0 0 0)",
  clipPath: "inset(50%)",
  height: 1,
  overflow: "hidden",
  position: "absolute",
  bottom: 0,
  left: 0,
  whiteSpace: "nowrap",
  width: 1,
});

export default function Dashboard() {
  const [school, setSchool] = useState(null);
  const [edit, setEdit] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imageError, setImageError] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const handleMessageClose = () => {
    setMessage('');
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setImageError("Image size should be less than 2MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImageError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      // Check for actual changes
      const hasImageChange = Boolean(imageFile);
      const hasNameChange = schoolName !== school.school_name;
      
      if (!hasImageChange && !hasNameChange) {
        setMessage('No changes detected');
        setMessageType('info');
        setIsSubmitting(false);
        return;
      }

      const formData = new FormData();
      if (imageFile) formData.append("school_image", imageFile);
      if (hasNameChange) formData.append("school_name", schoolName);

      const response = await axios.patch(
        "http://localhost:5000/api/school/update",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setMessage('School information updated successfully! 🎉');
      setMessageType('success');
      setSchool(response.data.data);
      setEdit(false);
      setImageFile(null);

    } catch (error) {
      console.error("Update error:", error);
      setMessage(error.response?.data?.message || 'Update failed. Please try again.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchSchool = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/login");
        return;
      }

      const response = await axios.get(
        "http://localhost:5000/api/school/fetch-single",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSchool(response.data.data);
      setSchoolName(response.data.data.school_name);
    } catch (error) {
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    }
  };

  useEffect(() => {
    fetchSchool();
  }, [message]); // Refetch when message changes (after updates)

  const handleCancelEdit = () => {
    setEdit(false);
    setImagePreview(null);
    setImageFile(null);
    setImageError('');
    setMessage('Changes discarded');
    setMessageType('info');
    fetchSchool(); // Reset to original data
  };

  return (
    <>
      <h1>Dashboard</h1>
      
      <MessageSnackbar 
        message={message} 
        type={messageType} 
        handleClose={handleMessageClose}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      />

      {edit ? (
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ maxWidth: 500, mx: "auto", p: 3 }}
        >
          <Stack spacing={3}>
            <Button
              component="label"
              variant="outlined"
              fullWidth
              startIcon={<CloudUpload />}
              sx={{
                height: 100,
                border: "2px dashed",
                borderColor: imageError ? "error.main" : "divider",
                "&:hover": {
                  borderColor: "primary.main",
                },
              }}
            >
              Add School Picture
              <VisuallyHiddenInput
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageChange}
              />
            </Button>
            
            {imageError && (
              <Typography color="error" variant="caption">
                {imageError}
              </Typography>
            )}

            {(imagePreview || school?.school_image) && (
              <Box sx={{ width: "100%", height: 200 }}>
                <img
                  src={imagePreview || `/images/uploaded/${school.school_image}`}
                  alt="School preview"
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    borderRadius: 4,
                  }}
                />
              </Box>
            )}

            <TextField
              fullWidth
              label="School Name"
              variant="outlined"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              InputProps={{
                sx: { borderRadius: 1 },
              }}
            />

            <Stack direction="row" spacing={2}>
              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={isSubmitting}
                sx={{ py: 1.5 }}
              >
                {isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  "Submit Edit"
                )}
              </Button>
              
              <Button
                fullWidth
                variant="outlined"
                onClick={handleCancelEdit}
                disabled={isSubmitting}
                sx={{ py: 1.5 }}
              >
                Cancel
              </Button>
            </Stack>
          </Stack>
        </Box>
      ) : (
        school && (
          <Box
            sx={{
              position: "relative",
              height: "500px",
              width: "100%",
              background: `url(/images/uploaded/${school.school_image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Typography
              variant="h3"
              sx={{
                color: "white",
                textShadow: "2px 2px 4px rgba(0,0,0,0.5)",
                backgroundColor: "rgba(0,0,0,0.5)",
                p: 2,
                borderRadius: 2,
              }}
            >
              {school.school_name}
            </Typography>

            <Box sx={{ position: "absolute", bottom: "10px", right: "10px" }}>
              <Button
                variant="contained"
                onClick={() => setEdit(true)}
                sx={{
                  borderRadius: "50%",
                  minWidth: 0,
                  width: 56,
                  height: 56,
                }}
              >
                <EditIcon />
              </Button>
            </Box>
          </Box>
        )
      )}
    </>
  );
}