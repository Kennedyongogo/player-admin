import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import ShieldIcon from "@mui/icons-material/Shield";

function Field({ icon, label, children }) {
  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid rgba(255,255,255,0.08)",
        bgcolor: "background.paper",
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5, textTransform: "uppercase" }}
      >
        {icon}
        {label}
      </Typography>
      {children}
    </Box>
  );
}

export default function UserAccount({ open, onClose, currentUser }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm" PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle
        sx={{
          background: "linear-gradient(135deg, #6D28D9 0%, #8B5CF6 100%)",
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: 2,
          pr: 6,
        }}
      >
        <PersonIcon />
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Account
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            {currentUser?.nickname}
          </Typography>
        </Box>
        <IconButton onClick={onClose} sx={{ position: "absolute", right: 12, top: 12, color: "white" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Field icon={<PersonIcon sx={{ fontSize: 16 }} />} label="Nickname">
            <Typography fontWeight={600}>{currentUser?.nickname}</Typography>
          </Field>
          <Field icon={<PhoneIcon sx={{ fontSize: 16 }} />} label="Phone">
            <Typography fontWeight={600}>{currentUser?.phone}</Typography>
          </Field>
          {currentUser?.email && (
            <Field icon={<EmailIcon sx={{ fontSize: 16 }} />} label="Email">
              <Typography fontWeight={600}>{currentUser.email}</Typography>
            </Field>
          )}
          <Field icon={<ShieldIcon sx={{ fontSize: 16 }} />} label="Role">
            <Chip
              size="small"
              label={currentUser?.role}
              sx={{ textTransform: "capitalize", fontWeight: 700 }}
              color={currentUser?.role === "superadmin" ? "secondary" : "primary"}
            />
          </Field>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
