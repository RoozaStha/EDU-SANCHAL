import * as React from "react";
import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import ImageListItemBar from "@mui/material/ImageListItemBar";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { Box } from "@mui/material";
import axios from "axios";

export default function TitlebarBelowImageList() {
  const [open, setOpen] = React.useState(false);
  const [selectedSchool, setSelectedSchool] = React.useState(null);
  const [schools, setSchools] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  const handleOpen = (school) => {
    setOpen(true);
    setSelectedSchool(school);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedSchool(null);
  };

  // Fixed modal styling
  const modalStyle = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "80%",
    maxWidth: 800,
    bgcolor: "background.paper",
    boxShadow: 24,
    p: 4,
    borderRadius: 2,
    outline: "none",
  };

  React.useEffect(() => {
    axios
      .get(`http://localhost:5000/api/school/all`)
      .then((resp) => {
        setSchools(resp.data?.data || []);
      })
      .catch((e) => {
        console.error("Error:", e);
        setError(e.message);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Typography>Loading...</Typography>;
  if (error) return <Typography color="error">Error: {error}</Typography>;

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h3"
        sx={{
          textAlign: "center",
          fontWeight: 700,
          color: "primary.main",
          position: "relative",
          display: "inline-block",
          width: "100%",
          py: 2,
          overflow: "hidden",
          "&:hover": {
            "& .animated-underline": {
              width: "100%",
              left: 0,
            },
          },
          "&:before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            width: "120px",
            height: "2px",
            backgroundColor: "text.secondary",
            opacity: 0.3,
          },
        }}
      >
        Registered Schools
        <Box
          className="animated-underline"
          sx={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            height: "4px",
            backgroundColor: "secondary.main",
            borderRadius: "2px",
            width: 0,
            transition: "all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1)",
          }}
        />
      </Typography>

      <ImageList variant="masonry" cols={3} gap={16}>
        {schools.map((school) => (
          <ImageListItem
            key={school._id}
            sx={{
              cursor: "pointer",
              transition: "transform 0.3s ease",
              "&:hover": {
                transform: "scale(1.03)",
              },
            }}
          >
            <img
              src={`/images/uploaded/${school.school_image}?w=248&fit=crop&auto=format`}
              srcSet={`/images/uploaded/${school.school_image}?w=248&fit=crop&auto=format&dpr=2 2x`}
              alt={school.school_name}
              loading="lazy"
              onClick={() => handleOpen(school)}
              style={{
                width: "100%",
                height: 248,
                objectFit: "cover",
                borderRadius: "8px",
              }}
            />
            <ImageListItemBar title={school.school_name} position="below" />
          </ImageListItem>
        ))}
      </ImageList>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="school-modal"
        sx={{ backdropFilter: "blur(3px)" }}
      >
        <Box sx={modalStyle}>
          {selectedSchool && (
            <>
              <Typography variant="h4" component="h2" gutterBottom>
                {selectedSchool.school_name}
              </Typography>
              <Box
                sx={{
                  width: "100%",
                  maxHeight: "70vh",
                  overflow: "hidden",
                  borderRadius: "12px",
                }}
              >
                <img
                  src={`/images/uploaded/${selectedSchool.school_image}`}
                  alt={selectedSchool.school_name}
                  style={{
                    width: "100%",
                    height: "auto",
                    objectFit: "contain",
                  }}
                  onError={(e) => {
                    e.target.src = "/images/default-school.jpg";
                  }}
                />
              </Box>
            </>
          )}
        </Box>
      </Modal>
    </Box>
  );
}
