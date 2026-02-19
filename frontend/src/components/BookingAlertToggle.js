import React, { useState } from "react";
import { Switch, Typography, Stack } from "@mui/material";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import NotificationsOffIcon from "@mui/icons-material/NotificationsOff";
import { toggleAlerts } from "../api/booking";

export default function BookingAlertToggle({ booking }) {
  const [enabled, setEnabled] = useState(booking.emailAlerts ?? false);


  const handleToggle = async () => {
    try {
      const res = await toggleAlerts(booking._id);
      setEnabled(res.emailAlerts);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Stack direction="row" spacing={1} alignItems="center" mt={1}>
      {enabled ? (
        <NotificationsActiveIcon color="primary" />
      ) : (
        <NotificationsOffIcon color="disabled" />
      )}

      <Switch checked={enabled} onChange={handleToggle} />

      <Typography className="alert-status-text">
        {enabled ? "Alerts ON" : "Alerts OFF"}
      </Typography>
    </Stack>
  );
}
