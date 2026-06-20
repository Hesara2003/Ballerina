import {
  Box,
  Button,
  Divider,
  InputAdornment,
  InputBase,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";
import { BookOpen, MapPin, Search, Settings, Users } from "lucide-react";

import BackgroundImage from "@assets/images/app-login-background.png";
import { APP_NAME } from "@config/config";
import { useAppAuthContext } from "@context/AuthContext";

const NAV_LINKS = ["Users API", "Documentation", "Integrations", "About"];

const LoginScreen = () => {
  const { appSignIn, appSignOut } = useAppAuthContext();

  const handleSignIn = () => {
    appSignOut();
    appSignIn();
  };

  return (
    <Box sx={{ width: "100vw", height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <Box
        component="nav"
        sx={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 3, md: 6 },
          py: 0,
          height: 60,
          bgcolor: "white",
          boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
        }}
      >
        {/* Logo + Nav links */}
        <Stack direction="row" alignItems="center" spacing={4}>
          <Typography variant="h6" fontWeight={900} color="#c41230" letterSpacing={-0.5}>
            {APP_NAME}
          </Typography>
          <Stack direction="row" spacing={3} sx={{ display: { xs: "none", md: "flex" } }}>
            {NAV_LINKS.map((link) => (
              <Typography
                key={link}
                variant="body2"
                fontWeight={600}
                color="#222"
                sx={{ cursor: "pointer", "&:hover": { color: "#c41230" }, transition: "color 0.15s" }}
              >
                {link}
              </Typography>
            ))}
          </Stack>
        </Stack>

        {/* Right: search + sign in */}
        <Stack direction="row" alignItems="center" spacing={2}>
          <Search size={20} color="#444" style={{ cursor: "pointer" }} />
          <Typography
            variant="body2"
            fontWeight={700}
            color="#c41230"
            sx={{ cursor: "pointer", "&:hover": { textDecoration: "underline" } }}
            onClick={handleSignIn}
          >
            Sign in
          </Typography>
        </Stack>
      </Box>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <Box sx={{ position: "relative", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Background photo */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${BackgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center right",
          }}
        />
        {/* Left gradient overlay */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to right, rgba(12,12,30,0.88) 38%, rgba(12,12,30,0.3) 70%, transparent 100%)",
          }}
        />

        {/* Hero text + CTAs */}
        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            px: { xs: 3, md: 7 },
            maxWidth: 680,
          }}
        >
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <Typography
              variant="h2"
              fontWeight={900}
              color="white"
              sx={{ fontSize: { xs: "2rem", md: "3.5rem" }, lineHeight: 1.1, mb: 2 }}
            >
              Manage users with confidence and speed
            </Typography>
            <Typography
              variant="body1"
              color="rgba(255,255,255,0.75)"
              sx={{ mb: 5, maxWidth: 480, fontSize: "1.05rem", lineHeight: 1.6 }}
            >
              A full-stack demo integrating Ballerina REST APIs, secured by
              Asgardeo identity, and deployed on Choreo.
            </Typography>

            {/* CTA columns */}
            <Stack direction={{ xs: "column", sm: "row" }} alignItems="flex-start" spacing={0}>
              {/* FOR DEVELOPERS */}
              <Box sx={{ pr: { sm: 5 } }}>
                <Typography
                  variant="overline"
                  color="rgba(255,255,255,0.5)"
                  fontWeight={700}
                  letterSpacing={2.5}
                  display="block"
                  mb={1.5}
                  fontSize="0.68rem"
                >
                  For Developers
                </Typography>
                <Button
                  variant="outlined"
                  startIcon={<BookOpen size={16} />}
                  onClick={handleSignIn}
                  sx={{
                    color: "white",
                    borderColor: "rgba(255,255,255,0.6)",
                    borderRadius: 1,
                    px: 3,
                    py: 1.1,
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    textTransform: "none",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.1)", borderColor: "white" },
                  }}
                >
                  Explore the API
                </Button>
              </Box>

              {/* Divider */}
              <Divider
                orientation="vertical"
                flexItem
                sx={{ borderColor: "rgba(255,255,255,0.2)", mx: 2, display: { xs: "none", sm: "block" }, my: 0.5 }}
              />

              {/* FOR ADMINS */}
              <Box sx={{ pl: { sm: 3 }, pt: { xs: 3, sm: 0 } }}>
                <Typography
                  variant="overline"
                  color="rgba(255,255,255,0.5)"
                  fontWeight={700}
                  letterSpacing={2.5}
                  display="block"
                  mb={1.5}
                  fontSize="0.68rem"
                >
                  For Admins
                </Typography>
                <Stack direction="row" spacing={1.5}>
                  <Button
                    variant="outlined"
                    startIcon={<Users size={16} />}
                    onClick={handleSignIn}
                    sx={{
                      color: "white",
                      borderColor: "rgba(255,255,255,0.6)",
                      borderRadius: 1,
                      px: 3,
                      py: 1.1,
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      textTransform: "none",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.1)", borderColor: "white" },
                    }}
                  >
                    Manage Users
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<Settings size={16} />}
                    onClick={handleSignIn}
                    sx={{
                      color: "white",
                      borderColor: "rgba(255,255,255,0.6)",
                      borderRadius: 1,
                      px: 3,
                      py: 1.1,
                      fontWeight: 700,
                      fontSize: "0.9rem",
                      textTransform: "none",
                      "&:hover": { bgcolor: "rgba(255,255,255,0.1)", borderColor: "white" },
                    }}
                  >
                    View Settings
                  </Button>
                </Stack>
              </Box>
            </Stack>
          </motion.div>
        </Box>

        {/* ── BOTTOM SEARCH PANEL ──────────────────────────────── */}
        <Box sx={{ position: "relative", zIndex: 2, px: { xs: 2, md: 6 }, pb: 0 }}>
          <Paper
            elevation={4}
            sx={{
              borderRadius: "12px 12px 0 0",
              px: { xs: 2, md: 4 },
              py: 2.5,
              display: "flex",
              alignItems: "center",
              gap: 0,
              flexWrap: { xs: "wrap", md: "nowrap" },
            }}
          >
            {/* User ID / Name field */}
            <Box sx={{ flex: 1, minWidth: 200, px: 2 }}>
              <InputBase
                placeholder="User Name or ID"
                startAdornment={
                  <InputAdornment position="start">
                    <Search size={18} color="#888" />
                  </InputAdornment>
                }
                sx={{ width: "100%", fontSize: "0.95rem" }}
              />
            </Box>

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            {/* Role / Location field */}
            <Box sx={{ flex: 1, minWidth: 160, px: 2 }}>
              <InputBase
                placeholder="Role or Department"
                startAdornment={
                  <InputAdornment position="start">
                    <MapPin size={18} color="#888" />
                  </InputAdornment>
                }
                sx={{ width: "100%", fontSize: "0.95rem" }}
              />
            </Box>

            {/* Search button */}
            <Button
              variant="contained"
              size="large"
              onClick={handleSignIn}
              sx={{
                bgcolor: "#c41230",
                borderRadius: 1.5,
                px: 4,
                py: 1.4,
                fontWeight: 700,
                fontSize: "0.95rem",
                textTransform: "none",
                whiteSpace: "nowrap",
                ml: { xs: 0, md: 2 },
                mt: { xs: 1.5, md: 0 },
                width: { xs: "100%", md: "auto" },
                "&:hover": { bgcolor: "#a00f26" },
              }}
            >
              Search Users
            </Button>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginScreen;
