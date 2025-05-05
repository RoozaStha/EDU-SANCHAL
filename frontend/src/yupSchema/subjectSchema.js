import * as yup from 'yup';

export const subjectSchema = yup.object().shape({
  subject_name: yup
    .string()
    .required('Subject name is required')
    .min(3, 'Subject name must be at least 3 characters')
    .max(100, 'Subject name cannot exceed 100 characters'),
  subject_codename: yup
    .string()
    .required('Subject code is required')
    .matches(
      /^[A-Z0-9]{3,10}$/,
      'Subject code must be 3-10 uppercase alphanumeric characters'
    )
});