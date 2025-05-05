import { useTheme } from "@mui/material/styles";
import {
  Box,
  Button,
  Stack,
  TextField,
  InputAdornment,
  keyframes,
  Typography
} from "@mui/material";
import { useFormik } from "formik";
import { classSchema } from "../../../yupSchema/classSchema";
import axios from "axios";
import { baseApi } from "../../../environment";
import { useEffect, useState } from "react";
// Animation keyframes
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
`;

const gradientFlow = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

export default function Class() {
  const theme = useTheme();
  const [classes, setClasses] = useState([]);
  const formik = useFormik({
    initialValues: {
      class_text: "",
      class_num: "",
    },
    validationSchema: classSchema,
    // Modify your formik onSubmit to handle errors better
    onSubmit: async (values) => {
      try {
        const response = await axios.post(`${baseApi}/class/create`, values);
        console.log("Class created:", response.data);
        formik.resetForm();
        fetchAllClasses();

        // Show success notification
        alert("Class created successfully!");
      } catch (error) {
        console.error("Error creating class:", error);

        // Show error notification
        alert(`Error: ${error.response?.data?.message || error.message}`);
      }
    },
  });

  const fetchAllClasses = () => {
    axios.get(`${baseApi}/class/all`).then((response) => {
          setClasses(response.data.data);
        }).catch((e) => {
        console.log("Error in fetching all classes", e);
      });
  };
 useEffect(()=>{
    fetchAllClasses();
 },[])
  return (
    <Box
      sx={{
        maxWidth: 500,
        mx: "auto",
        p: 3,
        animation: `${fadeIn} 0.5s ease-out`,
      }}
    >
      {/* Main Title */}
      <h1
        sx={{
          textAlign: "center",
          color: theme.palette.primary.main,
          fontSize: "2.5rem",
          fontWeight: 700,
          letterSpacing: "-0.5px",
          margin: "0 0 0.5rem 0",
          background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          animation: `${gradientFlow} 6s ease infinite`,
          backgroundSize: "200% 200%",
        }}
      >
        Class
      </h1>

      {/* Subtitle */}
      <h2
        style={{
          textAlign: "center",
          color: theme.palette.text.secondary,
          fontSize: "1.25rem",
          fontWeight: 400,
          marginBottom: theme.spacing(4),
          position: "relative",
          "&:after": {
            content: '""',
            display: "block",
            width: "50px",
            height: "2px",
            background: theme.palette.divider,
            margin: "1rem auto 0",
          },
        }}
      >
        Add New Class
      </h2>

      <Box
        component="form"
        onSubmit={formik.handleSubmit}
        sx={{
          "&:hover": {
            transform: "translateY(-2px)",
            transition: "transform 0.3s ease",
          },
        }}
      >
        <Stack spacing={3}>
          <TextField
            fullWidth
            variant="outlined"
            label="Class Text"
            name="class_text"
            value={formik.values.class_text}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={
              formik.touched.class_text && Boolean(formik.errors.class_text)
            }
            helperText={formik.touched.class_text && formik.errors.class_text}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">📚</InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: theme.shadows[2],
                },
              },
            }}
          />

          <TextField
            fullWidth
            variant="outlined"
            label="Class Number"
            name="class_num"
            type="number"
            value={formik.values.class_num}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched.class_num && Boolean(formik.errors.class_num)}
            helperText={formik.touched.class_num && formik.errors.class_num}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">🔢</InputAdornment>
              ),
              sx: {
                borderRadius: 2,
                transition: "all 0.3s ease",
                "&:hover": {
                  boxShadow: theme.shadows[2],
                },
              },
            }}
          />

          <Button
            fullWidth
            variant="contained"
            type="submit"
            size="large"
            sx={{
              py: 1.5,
              borderRadius: 2,
              fontWeight: "bold",
              textTransform: "none",
              fontSize: "1rem",
              background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.success.main} 100%)`,
              backgroundSize: "200% 200%",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow: theme.shadows[6],
                animation: `${gradientFlow} 3s ease infinite`,
              },
              transition: "all 0.3s ease",
              boxShadow: theme.shadows[3],
            }}
          >
            Create Class
          </Button>
          <Box
            component={"div"}
            sx={{ display: "flex", flexDirection: "row", flexWrap: "wrap" }}
          >
            {classes &&
              classes.map((x) => {
                return (
                  <Box key={x._id}>
                    <Typography>
                      Class: {x.class_text} [{x.class_num}]
                    </Typography>
                  </Box>
                );
              })}
          </Box>
        </Stack>
      </Box>
    </Box>
  );
}
