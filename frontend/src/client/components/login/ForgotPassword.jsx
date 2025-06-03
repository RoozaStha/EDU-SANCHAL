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
  Link,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from "@mui/material";
import { useFormik } from "formik";
import axios from "axios";
import MessageSnackbar from "../../../basic utility components/snackbar/MessageSnackbar";
import { forgotPasswordSchema } from "../../../yupSchema/forgotPasswordSchema";
import { useNavigate } from "react-router-dom";

export default function ForgotPassword() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [message, setMessage] = React.useState("");
  const [messageType, setMessageType] = React.useState("success");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [role, setRole] = React.useState("student");

  const formik = useFormik({
    initialValues: {
      email: "",
    },
    validationSchema: forgotPasswordSchema,
    onSubmit: async (values) => {
      setIsSubmitting(true);
      try {
        const response = await axios.post(
          `http://localhost:5000/api/${role}/forgot-password`,
          {
            email: values.email.trim().toLowerCase(),
            role
          },
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        setMessage(response.data.message || "Password reset link sent to your email!");
        setMessageType("success");
      } catch (error) {
        let errorMessage = "Failed to send reset link. Please try again.";

        if (error.response) {
          if (error.response.status === 404) {
            errorMessage = "No account found with that email address.";
          } else if (error.response.status === 429) {
            errorMessage = "Too many requests. Please try again later.";
          } else {
            errorMessage = error.response.data?.message || errorMessage;
          }
        }

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
          Reset Your Password
        </Typography>

        <Typography variant="body1" sx={{ mb: 3, textAlign: "center" }}>
          Enter your email address and we'll send you a link to reset your password.
        </Typography>

        <Box component="form" onSubmit={formik.handleSubmit}>
          <Stack spacing={3}>
            <FormControl fullWidth>
              <InputLabel>Account Type</InputLabel>
              <Select
                value={role}
                label="Account Type"
                onChange={(e) => setRole(e.target.value)}
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
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">✉️</InputAdornment>
                ),
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
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </Button>

            <Typography
              variant="body2"
              sx={{
                textAlign: "center",
                color: theme.palette.text.secondary,
              }}
            >
              Remember your password?{" "}
              <Link href="/login" sx={{ fontWeight: 500 }}>
                Sign in
              </Link>
            </Typography>
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