import * as React from "react";
import ImageList from "@mui/material/ImageList";
import ImageListItem from "@mui/material/ImageListItem";
import ImageListItemBar from "@mui/material/ImageListItemBar";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Modal from "@mui/material/Modal";
import { Box } from "@mui/material";
import axios from "axios";

export default function TitlebarBelowImageList() {
  const [open, setOpen] = React.useState(false);
  const [selectedSchool, setSelectedSchool] = React.useState(null);
  const [schools, setSchools] = React.useState([]); // Changed from static itemData
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

  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 400,
    bgcolor: "background.paper",
    border: "2px solid #000",
    boxShadow: 24,
    p: 4,
  };

  React.useEffect(() => {
    axios.get(`http://localhost:5000/api/school/all`)
      .then(resp => {
        console.log("API Response:", resp);
        // Set the schools state with API data
        setSchools(resp.data.schools || []);
      })
      .catch(e => {
        console.error("Error:", e);
        setError(e.message);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  if (error) {
    return <Typography color="error">Error: {error}</Typography>;
  }

  return (
    <Box>
      <ImageList sx={{ width: "100%", height: "auto" }}>
        {schools.map((school) => ( // Changed from itemData to schools
          <ImageListItem key={school._id}> {/* Use unique ID instead of img URL */}
            <img
              srcSet={`${school.school_image}?w=248&fit=crop&auto=format&dpr=2 2x`}
              src={`${school.school_image}?w=248&fit=crop&auto=format`}
              alt={school.school_name}
              loading="lazy"
              onClick={() => handleOpen(school)}
            />
            <ImageListItemBar
              title={school.school_name}
              subtitle={<span>Location: {school.location}</span>}
              position="below"
            />
          </ImageListItem>
        ))}
      </ImageList>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="school-modal"
      >
        <Box sx={style}>
          {selectedSchool && (
            <>
              <Typography variant="h6" component="h2">
                {selectedSchool.school_name}
              </Typography>
              <Typography sx={{ mt: 2 }}>
                {selectedSchool.description}
              </Typography>
              <img
                src={`${selectedSchool.school_image}?w=400&fit=crop&auto=format`}
                alt={selectedSchool.school_name}
                style={{ width: '100%', marginTop: '1rem' }}
              />
            </>
          )}
        </Box>
      </Modal>
    </Box>
  );
}