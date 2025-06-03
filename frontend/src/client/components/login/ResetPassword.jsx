import * as React from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Paper,
  useTheme,
  Stack,
  IconButton,
  InputAdornment
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material"; // Import icons
import { useFormik } from "formik";
import axios from "axios";
import MessageSnackbar from "../../../basic utility components/snackbar/MessageSnackbar";
import { resetPasswordSchema } from "../../../yupSchema/resetPasswordSchema";

export default function ResetPassword() {
  const { token } = useParams();
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = React.useState("");
  const [messageType, setMessageType] = React.useState("success");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isTokenValid, setIsTokenValid] = React.useState(false);
  const [isValidating, setIsValidating] = React.useState(true);
  
  // Password visibility states
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  // Get role from URL query params
  const queryParams = new URLSearchParams(location.search);
  const role = queryParams.get("role") || "student";

  // Toggle password visibility
  const handleClickShowPassword = () => setShowPassword(!showPassword);
  const handleClickShowConfirmPassword = () => setShowConfirmPassword(!showConfirmPassword);

  // Prevent mouse down event from propagating
  const handleMouseDownPassword = (e) => e.preventDefault();

  // Validate token on component mount
  React.useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await axios.get(
          `http://localhost:5000/api/${role}/validate-reset-token/${token}`,
          {
            params: { role },
          }
        );
        
        if (response.data.success) {
          setIsTokenValid(true);
        } else {
          setIsTokenValid(false);
          setMessage(response.data.message || "Invalid token");
          setMessageType("error");
        }
      } catch (error) {
        setIsTokenValid(false);
        setMessage(
          error.response?.data?.message ||
            "Invalid or expired password reset link"
        );
        setMessageType("error");
      }
      setIsValidating(false);
    };

    validateToken();
  }, [token, role]);

  const formik = useFormik({
    initialValues: {
      password: "",
      confirmPassword: "",
    },
    validationSchema: resetPasswordSchema,
    onSubmit: async (values) => {
      if (!isTokenValid) return;

      setIsSubmitting(true);
      try {
        const response = await axios.post(
          `http://localhost:5000/api/${role}/reset-password/${token}`,
          {
            password: values.password.trim(),
            role,
          },
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        setMessage(response.data.message || "Password reset successful!");
        setMessageType("success");

        setTimeout(() => navigate("/login"), 2000);
      } catch (error) {
        let errorMessage = "Failed to reset password. Please try again.";

        if (error.response) {
          if (error.response.status === 400) {
            errorMessage = error.response.data.message || errorMessage;
          } else if (error.response.status === 410) {
            errorMessage = "This password reset link has already been used.";
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

  if (isValidating) {
    return (
      <Container maxWidth="xs" sx={{ py: 8, textAlign: "center" }}>
        <Typography variant="h6">Validating reset token...</Typography>
      </Container>
    );
  }

  if (!isTokenValid) {
    return (
      <Container maxWidth="xs" sx={{ py: 8 }}>
        <MessageSnackbar
          message={message}
          type={messageType}
          handleClose={handleMessageClose}
          autoHideDuration={null}
        />
      </Container>
    );
  }

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
          Reset Password
        </Typography>

        <Box component="form" onSubmit={formik.handleSubmit}>
          <Stack spacing={3}>
            <TextField
              fullWidth
              variant="outlined"
              label="New Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              InputProps={{
                sx: { borderRadius: 2 },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleClickShowPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />

            <TextField
              fullWidth
              variant="outlined"
              label="Confirm New Password"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formik.values.confirmPassword}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={
                formik.touched.confirmPassword &&
                Boolean(formik.errors.confirmPassword)
              }
              helperText={
                formik.touched.confirmPassword && formik.errors.confirmPassword
              }
              InputProps={{
                sx: { borderRadius: 2 },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={handleClickShowConfirmPassword}
                      onMouseDown={handleMouseDownPassword}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
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
              {isSubmitting ? "Resetting..." : "Reset Password"}
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