import { useState } from "react";
import { Typography, Box, Button } from "@mui/material";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";

const carouselItems = [
  {
    image: "https://cdn.pixabay.com/photo/2020/12/10/20/40/color-5821297_1280.jpg",
    title: "Explore Our Classrooms",
    description: "Engaging and inspiring environments for every student.",
  },
  {
    image: "https://cdn.pixabay.com/photo/2017/10/10/00/03/child-2835430_1280.jpg",
    title: "Empowering Students",
    description: "We believe in fostering the potential of each child.",
  },
  {
    image: "https://cdn.pixabay.com/photo/2019/09/03/01/51/child-4448370_1280.jpg",
    title: "Learning Tools",
    description: "Providing the right tools for effective learning.",
  },
];

const Carousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = () => {
    setActiveIndex((prevIndex) => (prevIndex + 1) % carouselItems.length);
  };

  const handleBack = () => {
    setActiveIndex((prevIndex) =>
      prevIndex === 0 ? carouselItems.length - 1 : prevIndex - 1
    );
  };

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height: { xs: "400px", sm: "600px" },
        margin: "5px 0",
        overflow: "hidden",
        borderRadius: "8px",
        boxShadow: 2,
      }}
    >
      {/* Current Slide */}
      <Box
        sx={{
          position: "relative",
          height: "100%",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          transition: "opacity 0.5s ease",
        }}
      >
        <img
          src={carouselItems[activeIndex].image}
          alt={carouselItems[activeIndex].title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "center",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            bgcolor: "rgba(0,0,0,0.7)",
            padding: { xs: "12px", sm: "16px" },
            color: "white",
            textAlign: "center",
          }}
        >
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            {carouselItems[activeIndex].title}
          </Typography>
          <Typography variant="body1">
            {carouselItems[activeIndex].description}
          </Typography>
        </Box>
      </Box>

      {/* Navigation Buttons */}
      <Button
        onClick={handleBack}
        sx={{
          position: "absolute",
          top: "50%",
          left: "10px",
          transform: "translateY(-50%)",
          zIndex: 2,
          minWidth: "36px",
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          bgcolor: "rgba(255,255,255,0.8)",
          color: "primary.main",
          "&:hover": {
            bgcolor: "rgba(255,255,255,0.9)",
          },
          display: { xs: "none", sm: "flex" }, // Hide on mobile, show on desktop
        }}
      >
        <ArrowBackIosIcon fontSize="small" />
      </Button>

      <Button
        onClick={handleNext}
        sx={{
          position: "absolute",
          top: "50%",
          right: "10px",
          transform: "translateY(-50%)",
          zIndex: 2,
          minWidth: "36px",
          width: "36px",
          height: "36px",
          borderRadius: "50%",
          bgcolor: "rgba(255,255,255,0.8)",
          color: "primary.main",
          "&:hover": {
            bgcolor: "rgba(255,255,255,0.9)",
          },
          display: { xs: "none", sm: "flex" }, // Hide on mobile, show on desktop
        }}
      >
        <ArrowForwardIosIcon fontSize="small" />
      </Button>
    </Box>
  );
};

export default Carousel;