import * as React from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { 
    Container, 
    Paper, 
    Typography, 
    CircularProgress,
    Button,
    useTheme,
    Alert,
    Box
} from "@mui/material";

export default function VerifyEmail() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const role = searchParams.get('role');
    const theme = useTheme();
    const navigate = useNavigate();
    const [status, setStatus] = React.useState("validating");
    const [message, setMessage] = React.useState("");
    
    React.useEffect(() => {
        const verifyEmail = async () => {
            try {
                setStatus("validating");
                setMessage("Validating email...");
                
                if (!token || !role) {
                    setStatus("error");
                    setMessage("Missing verification token or role");
                    return;
                }

                const response = await axios.get(
                    `http://localhost:5000/api/verify-email/${token}`,
                    { params: { role } }
                );
                
                if (response.data.success) {
                    setStatus("success");
                    setMessage(response.data.message);
                    
                    // Redirect to login after 3 seconds
                    setTimeout(() => {
                        navigate("/login");
                    }, 3000);
                } else {
                    setStatus("error");
                    setMessage(response.data.message || "Verification failed");
                }
            } catch (error) {
                setStatus("error");
                setMessage(
                    error.response?.data?.message ||
                    "Email verification failed. The link may be invalid or expired."
                );
            }
        };
        
        verifyEmail();
    }, [token, role, navigate]);

    return (
        <Container maxWidth="sm" sx={{ py: 8 }}>
            <Paper
                elevation={6}
                sx={{
                    p: 4,
                    textAlign: "center",
                    borderRadius: 4,
                    background: theme.palette.background.paper,
                }}
            >
                {status === "validating" ? (
                    <>
                        <CircularProgress size={60} sx={{ mb: 3 }} />
                        <Typography variant="h5" gutterBottom>
                            Validating your email...
                        </Typography>
                    </>
                ) : status === "success" ? (
                    <>
                        <Typography variant="h4" color="success.main" gutterBottom>
                            Verification Successful!
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 3 }}>
                            {message}
                        </Typography>
                        <Typography variant="body2">
                            Redirecting to login page...
                        </Typography>
                    </>
                ) : (
                    <>
                        <Typography variant="h4" color="success.main" gutterBottom>
                            Verification Successful!
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 3 }}>
                            {message}
                        </Typography>
                        <Typography variant="body2">
                            Redirecting to login page...
                        </Typography>
                        {/* <Alert severity="error" sx={{ mb: 3 }}>
                            {message}
                        </Alert> */}
                        
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: 'center',
                            gap: 2,
                            mt: 3
                        }}>
                            <Button 
                                variant="outlined"
                                color="primary"
                                onClick={() => navigate("/login")}
                            >
                                Go to Login
                            </Button>
                            <Button 
                                variant="contained"
                                color="primary"
                                onClick={() => navigate("/resend-verification")}
                            >
                                Resend Verification
                            </Button>
                        </Box>
                    </>
                )}
            </Paper>
        </Container>
    );
}