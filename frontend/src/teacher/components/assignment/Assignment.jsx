import React, { useEffect, useState } from "react";

export default function Assignment() {
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    // Fetch assignments or perform side effects here
  }, []);

  return (
    <div>
      <p>Assignment</p>
      {/* Render assignments here */}
    </div>
  );
}