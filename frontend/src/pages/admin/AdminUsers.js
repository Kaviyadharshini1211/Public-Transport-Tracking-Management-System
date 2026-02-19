import React, { useEffect, useState } from "react";
import API from "../../api/api";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Chip
} from "@mui/material";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    API.get("/auth/list-users") // fetch ALL users except drivers
      .then((res) => setUsers(res.data))
      .catch((err) => console.error("Failed to load users:", err));
  }, []);

  return (
    <Box sx={{ padding: 2 }}>
      <Typography variant="h4" mb={3}>
        Users
      </Typography>

      <Grid container spacing={3}>
        {users.map((user) => (
          <Grid item xs={12} md={4} key={user._id}>
            <Card elevation={3} sx={{ borderRadius: 3 }}>
              <CardContent>
                <Stack direction="row" justifyContent="space-between">
                  <Typography variant="h6">
                    {user.name}
                  </Typography>

                  <Chip
                    label={user.role.toUpperCase()}
                    color={
                      user.role === "admin"
                        ? "error"
                        : user.role === "driver"
                        ? "primary"
                        : "success"
                    }
                    size="small"
                  />
                </Stack>

                <Typography mt={1} color="text.secondary">
                  {user.email}
                </Typography>

                <Typography mt={1}>
                  Google Login: {user.googleId ? "Yes" : "No"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
