import * as React from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

export default function MessageSnackbar({ message, type, handleClose }) {
  return (
    <Snackbar
      open={!!message}
      autoHideDuration={6000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      <Alert
        severity={type}
        action={
          <IconButton
            size="small"
            color="inherit"
            onClick={handleClose}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        }
        sx={{ width: '100%' }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
}