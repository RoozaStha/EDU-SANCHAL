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
  Avatar,
  useMediaQuery
} from '@mui/material';
import { Visibility, VisibilityOff, CloudUpload, AddAPhoto } from '@mui/icons-material';
import { useFormik } from 'formik';
import { useDropzone } from 'react-dropzone';
import { registerSchema } from '../../../yupSchema/registerSchema';

export default function Register() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      formik.setFieldValue('avatar', acceptedFiles[0]);
    }
  });

  const formik = useFormik({
    initialValues: {
      avatar: null,
      school_name: "",
      email: "",
      owner_name: "",
      password: "",
      confirm_password: ""
    },
    validationSchema: registerSchema,
    onSubmit: (values) => {
      console.log("Register submit values", values);
      // You would typically handle file upload here
    }
  });

  return (
    <Container maxWidth="sm">
      <Paper 
        elevation={3} 
        sx={{
          p: 4,
          mt: 8,
          borderRadius: 4,
          backgroundColor: theme.palette.background.paper,
        }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          sx={{ 
            textAlign: 'center',
            color: theme.palette.primary.main,
            fontWeight: 'bold',
            mb: 4
          }}
        >
          School Registration
        </Typography>

        <Box
          component="form"
          noValidate
          autoComplete="off"
          onSubmit={formik.handleSubmit}
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          {/* Image Upload Field */}
          <Box
            {...getRootProps()}
            sx={{
              width: '100%',
              border: `2px dashed ${formik.errors.avatar ? theme.palette.error.main : theme.palette.divider}`,
              borderRadius: 2,
              p: 2,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              '&:hover': {
                borderColor: theme.palette.primary.main,
                backgroundColor: theme.palette.action.hover
              }
            }}
          >
            <input {...getInputProps()} />
            {formik.values.avatar ? (
              <Box sx={{ position: 'relative' }}>
                <Avatar
                  src={URL.createObjectURL(formik.values.avatar)}
                  sx={{
                    width: 120,
                    height: 120,
                    margin: '0 auto',
                    boxShadow: theme.shadows[4]
                  }}
                />
                <IconButton
                  color="primary"
                  sx={{
                    position: 'absolute',
                    bottom: -8,
                    right: 'calc(50% - 60px)',
                    backgroundColor: theme.palette.background.paper,
                    '&:hover': {
                      backgroundColor: theme.palette.action.selected
                    }
                  }}
                >
                  <AddAPhoto fontSize="small" />
                </IconButton>
              </Box>
            ) : (
              <>
                <CloudUpload sx={{ fontSize: 50, color: theme.palette.text.secondary, mb: 1 }} />
                <Typography variant="body2" color="textSecondary">
                  Drag & drop school logo here, or click to select
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  (Recommended size: 500x500px, Max size: 5MB)
                </Typography>
              </>
            )}
          </Box>
          {formik.touched.avatar && formik.errors.avatar && (
            <Typography variant="caption" color="error" sx={{ mt: -1 }}>
              {formik.errors.avatar}
            </Typography>
          )}

          {/* Rest of the form fields */}
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
            <Box key={field.name}>
              <TextField
                fullWidth
                variant="outlined"
                name={field.name}
                label={field.label}
                type={field.type || 'text'}
                value={formik.values[field.name]}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched[field.name] && Boolean(formik.errors[field.name])}
                InputProps={{
                  endAdornment: field.toggle && (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={field.toggle}
                        edge="end"
                        aria-label="toggle password visibility"
                      >
                        {field.visible ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  )
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 1,
                  },
                }}
              />
              {formik.touched[field.name] && formik.errors[field.name] && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{
                    mt: 0.5,
                    display: 'block',
                    fontWeight: 'medium',
                  }}
                >
                  {formik.errors[field.name]}
                </Typography>
              )}
            </Box>
          ))}

          <Button
            fullWidth
            variant="contained"
            type="submit"
            size="large"
            startIcon={<CloudUpload />}
            sx={{
              mt: 3,
              py: 1.5,
              borderRadius: 2,
              textTransform: 'none',
              fontSize: '1rem',
              fontWeight: 'bold',
              boxShadow: theme.shadows[2],
              '&:hover': {
                boxShadow: theme.shadows[4],
                transform: 'translateY(-2px)',
              },
              transition: 'all 0.3s ease',
            }}
          >
            Complete Registration
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}