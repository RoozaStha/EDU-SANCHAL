import * as React from "react";
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Paper,
  useTheme,
  IconButton,
  InputAdornment,
  Stack,
  Link,
  InputLabel,
  MenuItem,
  FormControl,
  Select,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useFormik } from "formik";
import axios from "axios";
import MessageSnackbar from "../../../basic utility components/snackbar/MessageSnackbar";
import { loginSchema } from "../../../yupSchema/loginSchema";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../../context/AuthContext";

export default function Login() {
  const { login } = React.useContext(AuthContext);
  const theme = useTheme();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [messageType, setMessageType] = React.useState("success");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [role, setRole] = React.useState("student");

  const formik = useFormik({
    initialValues: {
      email: "",
      password: "",
    },
    validationSchema: loginSchema,
    onSubmit: async (values) => {
      let URL;
      if (role === "student") {
        URL = `http://localhost:5000/api/students/login`;
      } else if (role === "teacher") {
        URL = `http://localhost:5000/api/teachers/login`;
      } else if (role === "school") {
        URL = `http://localhost:5000/api/school/login`;
      }
      setIsSubmitting(true);
      try {
        const response = await axios.post(
          URL,
          {
            email: values.email.trim().toLowerCase(),
            password: values.password.trim(),
          },
          {
            headers: { "Content-Type": "application/json" },
          }
        );

        setMessage("Login successful! Redirecting...");
        setMessageType("success");

        // Store token and user data
        localStorage.setItem("token", response.data.token);
        localStorage.setItem("user", JSON.stringify(response.data.user));
        login(response.data.user, response.data.token);

        // Redirect based on role
        const redirectPath = role === "school" ? "/school" : `/${role}`;
        setTimeout(() => navigate(redirectPath), 1500);
      } catch (error) {
        // Improved error handling
        let errorMessage = "Login failed. Please check your credentials.";

        if (error.response) {
          // Handle specific error cases
          if (error.response.status === 403) {
            errorMessage = error.response.data.message;
          } else if (error.response.status === 401) {
            errorMessage = "Invalid email or password";
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
          Welcome Back
        </Typography>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="role-select-label">Role</InputLabel>
          <Select
            labelId="role-select-label"
            id="role-select"
            value={role}
            label="Role"
            onChange={(e) => {
              setRole(e.target.value);
            }}
          >
            <MenuItem value={"student"}>Student</MenuItem>
            <MenuItem value={"teacher"}>Teacher</MenuItem>
            <MenuItem value={"school"}>School</MenuItem>
          </Select>
        </FormControl>

        <Box component="form" onSubmit={formik.handleSubmit}>
          <Stack spacing={3}>
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

            <TextField
              fullWidth
              variant="outlined"
              label="Password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">🔒</InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
                sx: { borderRadius: 2 },
              }}
            />

            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Link
                href="/forgot-password"
                variant="body2"
                sx={{ color: theme.palette.text.secondary }}
              >
                Forgot Password?
              </Link>
            </Box>

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
              {isSubmitting ? "Signing In..." : "Sign In"}
            </Button>

            <Typography
              variant="body2"
              sx={{
                textAlign: "center",
                color: theme.palette.text.secondary,
              }}
            >
              Don't have an account?{" "}
              <Link href="/register" sx={{ fontWeight: 500 }}>
                Create account
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
