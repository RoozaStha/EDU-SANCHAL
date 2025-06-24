// client/src/client/components/verify-email/ResendVerification.jsx
import * as React from "react";
import { 
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Paper,
  useTheme,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from "@mui/material";
import { useFormik } from "formik";
import axios from "axios";
import MessageSnackbar from "../../../basic utility components/snackbar/MessageSnackbar";

export default function ResendVerification() {
  const theme = useTheme();
  const [message, setMessage] = React.useState("");
  const [messageType, setMessageType] = React.useState("success");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const formik = useFormik({
    initialValues: {
      email: "",
      role: "student"
    },
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        const response = await axios.post(
          "http://localhost:5000/api/resend-verification",
          values
        );

        setMessage(response.data.message || "Verification email sent!");
        setMessageType("success");
      } catch (error) {
        const errorMessage = error.response?.data?.message || 
          "Failed to resend verification email. Please try again.";
        
        setMessage(errorMessage);
        setMessageType("error");
      }
      setIsSubmitting(false);
    },
  });

  const handleMessageClose = () => {
    setMessage("");
  };

  return (
    <Container maxWidth="xs" sx={{ py: 8 }}>
      <Paper
        elevation={6}
        sx={{
          p: 4,
          borderRadius: 4,
          background: theme.palette.background.paper,
          boxShadow: theme.shadows[4],
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{
            textAlign: "center",
            fontWeight: 700,
            color: theme.palette.primary.main,
            mb: 4,
            "&:after": {
              content: '""',
              display: "block",
              width: "50px",
              height: "2px",
              background: theme.palette.secondary.main,
              margin: "12px auto 0",
              borderRadius: 1,
            },
          }}
        >
          Resend Verification Email
        </Typography>

        <Box component="form" onSubmit={formik.handleSubmit}>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Account Type</InputLabel>
              <Select
                value={formik.values.role}
                label="Account Type"
                name="role"
                onChange={formik.handleChange}
              >
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="teacher">Teacher</MenuItem>
                <MenuItem value="school">School</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              variant="outlined"
              label="Email Address"
              name="email"
              value={formik.values.email}
              onChange={formik.handleChange}
              InputProps={{
                sx: { borderRadius: 2 },
              }}
            />

            <Button
              fullWidth
              variant="contained"
              type="submit"
              size="large"
              disabled={isSubmitting}
              sx={{
                py: 1.5,
                borderRadius: 2,
                fontWeight: "bold",
                textTransform: "none",
                fontSize: "1rem",
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                "&:hover": {
                  transform: "translateY(-1px)",
                  boxShadow: theme.shadows[3],
                },
                transition: "all 0.2s ease",
              }}
            >
              {isSubmitting ? "Sending..." : "Resend Verification"}
            </Button>
          </Stack>
        </Box>
      </Paper>

      <MessageSnackbar
        message={message}
        type={messageType}
        handleClose={handleMessageClose}
        autoHideDuration={3000}
      />
    </Container>
  );
}