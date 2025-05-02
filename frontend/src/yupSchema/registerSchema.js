import * as yup from 'yup';

export const registerSchema = yup.object().shape({
  school_name: yup.string().required('School name is required'),
  email: yup.string().email('Invalid email format').required('Email is required'),
  owner_name: yup.string().required('Owner name is required'),
  password: yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and numbers'
    ),
  confirm_password: yup.string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
  school_image: yup.mixed()
    .required('School logo is required')
    .test('fileType', 'Only JPEG/PNG images allowed', (value) => {
      if (value) return ['image/jpeg', 'image/png'].includes(value.type);
      return true;
    })
    .test('fileSize', 'Image too large (max 2MB)', (value) => {
      if (value) return value.size <= 2 * 1024 * 1024; // 2MB
      return true;
    })
});