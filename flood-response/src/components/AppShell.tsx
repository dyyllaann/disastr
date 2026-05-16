import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import WaterIcon from "@mui/icons-material/Water";

const NAV_LINKS = [
  { to: "/", label: "Map", end: true },
  { to: "/report", label: "Report" },
  { to: "/guidance", label: "Guidance" },
  { to: "/alerts", label: "Alerts" },
  { to: "/admin", label: "Admin" },
];

export default function AppShell() {
  return (
    <div className="flex flex-col h-dvh">
      {/* Skip-to-content for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-white focus:px-3 focus:py-2 focus:text-blue-700 focus:shadow focus:ring-2 focus:ring-blue-500"
      >
        Skip to main content
      </a>

      <AppBar position="static" sx={{ bgcolor: "primary.main", flexShrink: 0 }}>
        <Toolbar sx={{ gap: 1 }}>
          {/* Brand */}
          <WaterIcon sx={{ mr: 0.5 }} />
          <Typography
            variant="h6"
            component="span"
            fontWeight={700}
            sx={{ flexGrow: 1, userSelect: "none" }}
            aria-label="Flood Response Platform"
          >
            FloodResponse
          </Typography>

          {/* Nav links */}
          <Box component="nav" aria-label="Primary navigation" sx={{ display: "flex", gap: 0.5 }}>
            {NAV_LINKS.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} style={{ textDecoration: "none" }}>
                {({ isActive }) => (
                  <Button
                    size="small"
                    sx={{
                      color: "white",
                      fontWeight: isActive ? 700 : 400,
                      bgcolor: isActive ? "rgba(255,255,255,0.15)" : "transparent",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                      textTransform: "none",
                      minWidth: 0,
                    }}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {label}
                  </Button>
                )}
              </NavLink>
            ))}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Page content */}
      <div id="main-content" className="flex-1 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
