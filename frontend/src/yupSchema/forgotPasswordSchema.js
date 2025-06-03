import * as yup from "yup";

export const forgotPasswordSchema = yup.object({
  email: yup
    .string()
    .email("Enter a valid email")
    .required("Email is required")
    .max(100, "Email must be at most 100 characters"),
});