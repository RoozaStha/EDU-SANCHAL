import * as React from 'react';
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
  CardMedia,
  Stack,
  styled,
  Alert
} from '@mui/material';
import { Visibility, VisibilityOff, CloudUpload } from '@mui/icons-material';
import { registerSchema } from '../../../yupSchema/registerSchema';
import { useFormik } from 'formik';
import axios from 'axios';
import MessageSnackbar from '../../../basic utility components/snackbar/MessageSnackbar';

const VisuallyHiddenInput = styled('input')({
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: 1,
  overflow: 'hidden',
  position: 'absolute',
  bottom: 0,
  left: 0,
  whiteSpace: 'nowrap',
  width: 1,
});

export default function Register() {
  const theme = useTheme();
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [message, setMessage] = React.useState('');
  const [messageType, setMessageType] = React.useState('success');
  const [imageError, setImageError] = React.useState('');
  const fileInputRef = React.useRef(null);

  const formik = useFormik({
    initialValues: {
      school_name: '',
      email: '',
      owner_name: '',
      password: '',
      confirm_password: '',
      school_image: null
    },
    validationSchema: registerSchema,
    onSubmit: async (values, { resetForm }) => {
      try {
        // Manual image validation
        if (!values.school_image) {
          setImageError('School logo is required');
          return;
        }

        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => {
          formData.append(key, value);
        });

        const response = await axios.post(
          'http://localhost:5000/api/school/register', 
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );

        setMessage(response.data.message || 'Registration successful!');
        setMessageType('success');
        resetForm();
        if (fileInputRef.current) fileInputRef.current.value = '';
        setImageError('');
      } catch (error) {
        const errorMessage = error.response?.data?.message || 
          error.response?.data?.error || 
          'Registration failed. Please try again.';
        
        setMessage(errorMessage);
        setMessageType('error');
        
        // Handle image-related errors
        if (errorMessage.toLowerCase().includes('image')) {
          setImageError(errorMessage);
        }
      }
    }
  });

  const addImage = (event) => {
    const file = event.target.files[0];
    if (file) {
      formik.setFieldValue('school_image', file);
      setImageError('');
    }
  };

  const handleMessageClose = () => {
    setMessage('');
  };

  // Password strength indicator
  const passwordStrengthMessage = () => {
    if (!formik.values.password) return '';
    if (formik.errors.password) return formik.errors.password;
    
    const hasUppercase = /[A-Z]/.test(formik.values.password);
    const hasLowercase = /[a-z]/.test(formik.values.password);
    const hasNumber = /\d/.test(formik.values.password);
    
    return (
      <Box component="span" sx={{ fontSize: '0.75rem' }}>
        Password strength: 
        {hasUppercase && hasLowercase && hasNumber ? (
          <span style={{ color: theme.palette.success.main }}> Strong</span>
        ) : (
          <span style={{ color: theme.palette.warning.main }}> Weak</span>
        )}
      </Box>
    );
  };

  return (
    <>
      <MessageSnackbar 
        message={message} 
        type={messageType} 
        handleClose={handleMessageClose}
      />

      <Container maxWidth="sm" sx={{ py: { xs: 2, sm: 4 } }}>
        <Paper
          elevation={6}
          sx={{
            p: { xs: 2, sm: 4 },
            border: `2px solid ${theme.palette.divider}`,
            borderRadius: 3,
            background: theme.palette.background.paper,
            boxShadow: theme.shadows[4],
            transition: 'transform 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)'
            }
          }}
        >
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{
              textAlign: 'center',
              color: theme.palette.primary.main,
              fontWeight: 700,
              letterSpacing: 0.5,
              mb: 3,
              fontSize: { xs: '1.5rem', sm: '1.8rem' },
              '&:after': {
                content: '""',
                display: 'block',
                width: '50px',
                height: '2px',
                background: theme.palette.secondary.main,
                margin: '12px auto 0',
                borderRadius: 1
              }
            }}
          >
            School Registration
          </Typography>

          <Box
            component="form"
            onSubmit={formik.handleSubmit}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <Stack spacing={2}>
              <Button
                component="label"
                variant="outlined"
                color="secondary"
                startIcon={<CloudUpload sx={{ fontSize: { xs: '1rem', sm: '1.2rem' } }} />}
                sx={{
                  height: { xs: 70, sm: 80 },
                  border: `2px dashed ${imageError ? theme.palette.error.main : theme.palette.divider}`,
                  '&:hover': {
                    border: `2px dashed ${theme.palette.primary.main}`,
                    backgroundColor: theme.palette.action.hover
                  }
                }}
              >
                <Stack alignItems="center" spacing={0.5}>
                  <Typography
                    variant="body1"
                    fontWeight="500"
                    sx={{ fontSize: { xs: '0.9rem', sm: '1rem' } }}
                  >
                    Upload School Logo
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    PNG, JPG (max 2MB)
                  </Typography>
                </Stack>
                <VisuallyHiddenInput
                  type="file"
                  inputRef={fileInputRef}
                  accept="image/*"
                  onChange={addImage}
                  name="school_image"
                />
              </Button>
              {imageError && (
                <Alert severity="error" sx={{ mt: -1 }}>
                  {imageError}
                </Alert>
              )}

              {formik.values.school_image && (
                <CardMedia
                  component="img"
                  image={URL.createObjectURL(formik.values.school_image)}
                  alt="School preview"
                  sx={{
                    borderRadius: 2,
                    border: `2px solid ${theme.palette.divider}`,
                    height: { xs: 120, sm: 150 },
                    objectFit: 'cover',
                    boxShadow: theme.shadows[2],
                  }}
                />
              )}

              {[
                { name: 'school_name', label: 'School Name' },
                { name: 'email', label: 'Email', type: 'email' },
                { name: 'owner_name', label: 'Owner Name' },
                { 
                  name: 'password', 
                  label: 'Password', 
                  type: showPassword ? 'text' : 'password',
                  toggle: () => setShowPassword(!showPassword),
                  visible: showPassword
                },
                { 
                  name: 'confirm_password', 
                  label: 'Confirm Password', 
                  type: showConfirmPassword ? 'text' : 'password',
                  toggle: () => setShowConfirmPassword(!showConfirmPassword),
                  visible: showConfirmPassword
                },
              ].map((field) => (
                <TextField
                  key={field.name}
                  fullWidth
                  variant="outlined"
                  name={field.name}
                  label={field.label}
                  type={field.type || 'text'}
                  size="small"
                  value={formik.values[field.name]}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    (formik.touched[field.name] && Boolean(formik.errors[field.name])) ||
                    (field.name === 'password' && !!formik.values.password)
                  }
                  helperText={
                    field.name === 'password' ? (
                      passwordStrengthMessage()
                    ) : (
                      formik.touched[field.name] && formik.errors[field.name]
                    )
                  }
                  InputProps={{
                    endAdornment: field.toggle && (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={field.toggle}
                          edge="end"
                          size="small"
                          aria-label="toggle password visibility"
                          sx={{ color: theme.palette.text.secondary }}
                        >
                          {field.visible ? (
                            <VisibilityOff fontSize="small" />
                          ) : (
                            <Visibility fontSize="small" />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                    sx: {
                      borderRadius: 1.5,
                      fontSize: '0.9rem',
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: theme.palette.primary.main,
                        borderWidth: 2
                      }
                    }
                  }}
                  InputLabelProps={{
                    sx: {
                      fontSize: '0.9rem',
                      fontWeight: 500,
                      color: theme.palette.text.secondary
                    }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 1.5,
                      padding: theme.spacing(1.5, 2),
                      '& fieldset': {
                        borderWidth: 1.5,
                        borderColor: theme.palette.divider
                      }
                    }
                  }}
                />
              ))}
            </Stack>

            <Button
              fullWidth
              variant="contained"
              type="submit"
              size="medium"
              sx={{
                mt: 3,
                py: 1.2,
                borderRadius: 1.5,
                border: `1.5px solid ${theme.palette.primary.dark}`,
                background: `linear-gradient(45deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
                fontSize: '0.9rem',
                fontWeight: 'bold',
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                boxShadow: theme.shadows[2],
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: theme.shadows[4],
                  background: `linear-gradient(45deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
                }
              }}
            >
              Create Account
            </Button>
          </Box>
        </Paper>
      </Container>
    </>
  );
}