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
import { ChevronDown, MapPin, Search } from "lucide-react";

import BackgroundImage from "@assets/images/app-login-background.png";
import { APP_NAME } from "@config/config";
import { useAppAuthContext } from "@context/AuthContext";

const NAV_LINKS = ["Users API", "Documentation", "Integrations", "About"];

const OutlineHeroBtn = ({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick: () => void;
}) => (
  <Button
    onClick={onClick}
    variant="outlined"
    sx={{
      color: "white",
      borderColor: "white",
      borderRadius: 0,
      px: 3,
      py: 1.2,
      fontWeight: 600,
      fontSize: "0.9rem",
      textTransform: "none",
      justifyContent: "flex-start",
      minWidth: 230,
      "&:hover": { bgcolor: "rgba(255,255,255,0.12)", borderColor: "white" },
    }}
  >
    {children}
  </Button>
);

const LoginScreen = () => {
  const { appSignIn, appSignOut } = useAppAuthContext();

  const handleSignIn = () => {
    appSignOut();
    appSignIn();
  };

  return (
    <Box
      sx={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* ── NAVBAR ─────────────────────────────────── */}
      <Box
        component="nav"
        sx={{
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: { xs: 3, md: 5 },
          height: 58,
          bgcolor: "white",
          boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
          flexShrink: 0,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={4}>
          <Typography variant="h6" fontWeight={900} color="#c41230" letterSpacing={-0.5}>
            {APP_NAME}
          </Typography>
          <Stack
            direction="row"
            spacing={3.5}
            sx={{ display: { xs: "none", md: "flex" } }}
          >
            {NAV_LINKS.map((link) => (
              <Stack
                key={link}
                direction="row"
                alignItems="center"
                spacing={0.3}
                sx={{ cursor: "pointer", "&:hover .nav-text": { color: "#c41230" } }}
              >
                <Typography
                  className="nav-text"
                  variant="body2"
                  fontWeight={600}
                  color="#222"
                  sx={{ transition: "color 0.15s" }}
                >
                  {link}
                </Typography>
                <ChevronDown size={14} color="#444" />
              </Stack>
            ))}
          </Stack>
        </Stack>

        <Stack direction="row" alignItems="center" spacing={2.5}>
          <Search size={20} color="#333" style={{ cursor: "pointer" }} />
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

      {/* ── HERO ───────────────────────────────────── */}
      <Box sx={{ position: "relative", flex: 1, display: "flex", flexDirection: "column" }}>

        {/* Background image — very subtle texture */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            backgroundImage: `url(${BackgroundImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center right",
            opacity: 0.18,
          }}
        />

        {/* Strong dark base so image stays as texture only */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(108deg, #0d0b1f 0%, #131030 45%, #1c1640 75%, #0d0b1f 100%)",
          }}
        />

        {/* Subtle left-to-right colour fade for depth */}
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(90deg, rgba(6,4,18,0.7) 0%, transparent 55%)",
          }}
        />

        {/* Hero text + CTAs — left side */}
        <Box
          sx={{
            position: "relative",
            zIndex: 2,
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            pl: { xs: 3, md: 7 },
            pr: { xs: 3, md: "52%" },
            pb: "100px",
          }}
        >
          {/* Headline */}
          <Typography
            fontWeight={900}
            color="white"
            sx={{
              fontSize: { xs: "2.4rem", sm: "3.4rem", md: "4.4rem" },
              lineHeight: 1.06,
              mb: 2.5,
              letterSpacing: "-1px",
            }}
          >
            Manage users with<br />total confidence
          </Typography>

          {/* Subtitle */}
          <Typography
            variant="body1"
            color="rgba(255,255,255,0.78)"
            sx={{ mb: 4.5, fontSize: "1.05rem", lineHeight: 1.7, maxWidth: 480 }}
          >
            A full-stack demo powered by Ballerina, secured by Asgardeo, and
            deployed on Choreo — explore the Users API in action.
          </Typography>

          {/* CTA columns */}
          <Stack direction={{ xs: "column", sm: "row" }} alignItems="flex-start" spacing={0}>

            {/* FOR DEVELOPERS */}
            <Box>
              <Typography
                variant="overline"
                color="rgba(255,255,255,0.55)"
                fontWeight={700}
                letterSpacing={2}
                display="block"
                mb={1.5}
                fontSize="0.68rem"
              >
                For Developers
              </Typography>
              <OutlineHeroBtn onClick={handleSignIn}>
                Explore the API
              </OutlineHeroBtn>
            </Box>

            {/* Vertical divider */}
            <Divider
              orientation="vertical"
              flexItem
              sx={{
                borderColor: "rgba(255,255,255,0.25)",
                mx: 4,
                mt: "28px",
                display: { xs: "none", sm: "block" },
              }}
            />

            {/* FOR ADMINS */}
            <Box sx={{ pt: { xs: 3, sm: 0 } }}>
              <Typography
                variant="overline"
                color="rgba(255,255,255,0.55)"
                fontWeight={700}
                letterSpacing={2}
                display="block"
                mb={1.5}
                fontSize="0.68rem"
              >
                For Admins
              </Typography>
              <Stack spacing={1.5}>
                <OutlineHeroBtn onClick={handleSignIn}>
                  Manage Users
                </OutlineHeroBtn>
                <OutlineHeroBtn onClick={handleSignIn}>
                  View Settings
                </OutlineHeroBtn>
              </Stack>
            </Box>
          </Stack>
        </Box>

        {/* ── BOTTOM SEARCH PANEL ─────────────────── */}
        <Box
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 3,
          }}
        >
          <Paper
            elevation={8}
            sx={{
              borderRadius: 0,
              px: { xs: 3, md: 7 },
              py: 3,
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexWrap: { xs: "wrap", md: "nowrap" },
            }}
          >
            {/* Search input */}
            <Box sx={{ flex: 2, minWidth: 200, px: 1 }}>
              <InputBase
                placeholder="User Name, ID or Role"
                startAdornment={
                  <InputAdornment position="start">
                    <Search size={18} color="#999" />
                  </InputAdornment>
                }
                sx={{ width: "100%", fontSize: "0.95rem" }}
              />
            </Box>

            <Divider orientation="vertical" flexItem />

            {/* Location-style input */}
            <Box sx={{ flex: 1, minWidth: 150, px: 1 }}>
              <InputBase
                placeholder="Department or Role"
                startAdornment={
                  <InputAdornment position="start">
                    <MapPin size={18} color="#999" />
                  </InputAdornment>
                }
                sx={{ width: "100%", fontSize: "0.95rem" }}
              />
            </Box>

            {/* CTA button */}
            <Button
              variant="contained"
              size="large"
              onClick={handleSignIn}
              sx={{
                bgcolor: "#c41230",
                borderRadius: 1,
                px: 4,
                py: 1.5,
                fontWeight: 700,
                fontSize: "0.95rem",
                textTransform: "none",
                flexShrink: 0,
                ml: 1,
                width: { xs: "100%", md: "auto" },
                mt: { xs: 1.5, md: 0 },
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
