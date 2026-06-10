import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  Chip,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LockClockIcon from "@mui/icons-material/LockClock";
import SendIcon from "@mui/icons-material/Send";
import HistoryToggleOffIcon from "@mui/icons-material/HistoryToggleOff";

const formatTimestamp = (timestamp) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const buildMessageAuthor = (message, suspension) => {
  if (message.sender_role === "admin") {
    return {
      name: "Admin",
      color: "#b8860b",
      align: "flex-end",
      bg: "rgba(255, 215, 0, 0.15)",
      textColor: "#2c3e50",
      isSelf: true,
    };
  }
  const displayName =
    suspension?.publicUser?.name ||
    suspension?.publicUser?.username ||
    "Public User";
  return {
    name: displayName,
    color: "#5a8a93",
    align: "flex-start",
    bg: "rgba(90, 138, 147, 0.12)",
    textColor: "#2c3e50",
    isSelf: false,
  };
};

const SuspensionChatModal = ({
  open,
  onClose,
  suspension,
  token,
  onUnreadUpdate,
  onSuspensionRevoked,
  onRequestRevoke,
}) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [error, setError] = useState("");

  const suspensionId = suspension?.id;
  const publicUserId = suspension?.public_user_id;

  const appendMessage = useCallback((newMessage) => {
    if (!newMessage) return;
    setMessages((prev) => {
      const exists = prev.some((msg) => msg.id === newMessage.id);
      if (exists) {
        return prev.map((msg) =>
          msg.id === newMessage.id ? { ...msg, ...newMessage } : msg
        );
      }
      return [...prev, newMessage].sort(
        (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
      );
    });
  }, []);

  const fetchThread = useCallback(async (silent = false) => {
    if (!open || !suspensionId || !token) return;
    try {
      if (!silent) {
        setLoading(true);
      }
      setError("");
      const response = await fetch(
        `/api/suspensions/admin/${suspensionId}/messages`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to load appeal messages.");
      }

      const threadMessages = payload.data?.messages || [];
      setMessages(threadMessages);

      if (typeof onUnreadUpdate === "function") {
        onUnreadUpdate(publicUserId, payload.data?.unreadCount ?? 0);
      }

      await fetch(`/api/suspensions/admin/${suspensionId}/messages/read`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (typeof onUnreadUpdate === "function") {
        onUnreadUpdate(publicUserId, 0);
      }
    } catch (err) {
      console.error("[SuspensionChatModal] fetchThread error:", err);
      if (!silent) {
        setError(err.message || "Failed to load appeal chat.");
      }
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [open, suspensionId, token, onUnreadUpdate, publicUserId]);

  useEffect(() => {
    if (open && suspensionId) {
      fetchThread(false);
    } else if (!open) {
      setMessages([]);
      setMessageInput("");
      setError("");
    }
  }, [open, suspensionId, fetchThread]);

  useEffect(() => {
    if (!open || !suspensionId) {
      return undefined;
    }

    const intervalId = setInterval(() => {
      fetchThread(true);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [open, suspensionId, fetchThread]);

  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || !suspensionId || !token) return;
    try {
      setSending(true);
      const response = await fetch(
        `/api/suspensions/admin/${suspensionId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: messageInput.trim() }),
        }
      );
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to send message.");
      }
      appendMessage(payload.data);
      setMessageInput("");
      if (typeof onUnreadUpdate === "function") {
        onUnreadUpdate(publicUserId, 0);
      }
    } catch (err) {
      console.error("[SuspensionChatModal] send message error:", err);
      setError(err.message || "Failed to send appeal message.");
    } finally {
      setSending(false);
    }
  }, [
    messageInput,
    suspensionId,
    token,
    appendMessage,
    onUnreadUpdate,
    publicUserId,
  ]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  const isRevoked = suspension?.status === "revoked";

  const displayReason = useMemo(() => {
    if (!suspension?.reason) return "No reason provided.";
    return suspension.reason;
  }, [suspension]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          borderRadius: 3,
          overflow: "hidden",
          border: "2px solid rgba(255, 215, 0, 0.3)",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          pr: 2,
          background:
            "linear-gradient(135deg, #ffffff 0%, #fff9e6 50%, #fef5e7 100%)",
        }}
      >
        <Stack direction="row" spacing={1.5} alignItems="center">
          <LockClockIcon sx={{ color: "#b8860b" }} />
          <Box>
            <Typography variant="h6" fontWeight={700} color="#2c3e50">
              Suspension Appeal
            </Typography>
            <Typography variant="body2" color="#7f8c8d">
              {suspension?.publicUser?.name || suspension?.public_user_id}
            </Typography>
          </Box>
        </Stack>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent
        sx={{
          backgroundColor: "#ffffff",
          minHeight: 360,
          p: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box
          sx={{
            p: 2.5,
            borderBottom: "1px solid rgba(255, 215, 0, 0.25)",
            backgroundColor: "rgba(255, 215, 0, 0.05)",
          }}
        >
          <Typography
            variant="subtitle2"
            fontWeight={700}
            color="#b8860b"
            display="flex"
            alignItems="center"
            gap={1}
          >
            <HistoryToggleOffIcon fontSize="small" />
            Suspension Reason
          </Typography>
          <Typography
            variant="body2"
            color="#2c3e50"
            sx={{ mt: 1, whiteSpace: "pre-line" }}
          >
            {displayReason}
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
            <Chip
              label={`Started: ${formatTimestamp(suspension?.createdAt)}`}
              size="small"
              color="warning"
              variant="outlined"
            />
            {suspension?.metadata?.updated_at && (
              <Chip
                label={`Updated: ${formatTimestamp(
                  suspension.metadata.updated_at
                )}`}
                size="small"
                color="warning"
                variant="outlined"
              />
            )}
          </Stack>
        </Box>
        <Box
          sx={{
            flexGrow: 1,
            overflowY: "auto",
            p: 2.5,
            backgroundColor: "#fafafa",
          }}
        >
          {loading ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
              }}
            >
              <CircularProgress sx={{ color: "#FFD700" }} />
            </Box>
          ) : messages.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                color: "#7f8c8d",
                gap: 1,
              }}
            >
              <Typography variant="body1">
                No appeal messages yet. Start the conversation below.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={2}>
              {messages.map((message) => {
                const author = buildMessageAuthor(
                  message,
                  suspension,
                  suspension
                );
                return (
                  <Stack
                    key={message.id}
                    direction="row"
                    justifyContent={author.align}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="flex-start"
                      sx={{ maxWidth: "75%" }}
                    >
                      {!author.isSelf && (
                        <Avatar
                          sx={{
                            bgcolor: author.color,
                            width: 32,
                            height: 32,
                            fontSize: 13,
                          }}
                        >
                          {author.name
                            .split(" ")
                            .map((part) => part.charAt(0))
                            .join("")
                            .toUpperCase()}
                        </Avatar>
                      )}
                      <Box>
                        <Stack
                          direction="row"
                          spacing={1}
                          alignItems="center"
                          sx={{ mb: 0.5 }}
                        >
                          <Typography variant="subtitle2" color={author.color}>
                            {author.name}
                          </Typography>
                          <Typography variant="caption" color="#7f8c8d">
                            {formatTimestamp(message.createdAt)}
                          </Typography>
                        </Stack>
                        <Box
                          sx={{
                            backgroundColor: author.bg,
                            color: author.textColor,
                            p: 1.5,
                            borderRadius: 2,
                            boxShadow: "0 4px 12px rgba(90, 138, 147, 0.12)",
                            border: "1px solid rgba(0, 0, 0, 0.04)",
                            whiteSpace: "pre-line",
                          }}
                        >
                          <Typography variant="body2">
                            {message.message}
                          </Typography>
                        </Box>
                      </Box>
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
          )}
        </Box>
        {error && (
          <Box
            sx={{
              px: 2.5,
              pb: 1,
              color: "error.main",
            }}
          >
            <Typography variant="body2">{error}</Typography>
          </Box>
        )}
        <Divider />
        <Box sx={{ p: 2.5, backgroundColor: "#ffffff" }}>
          <TextField
            value={messageInput}
            onChange={(event) => setMessageInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your response to the appeal..."
            multiline
            minRows={2}
            maxRows={5}
            fullWidth
            disabled={sending || isRevoked}
            InputProps={{
              sx: {
                borderRadius: 2,
                backgroundColor: "#fafafa",
              },
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions
        sx={{
          p: 2,
          background:
            "linear-gradient(135deg, #ffffff 0%, #fff9e6 50%, #fef5e7 100%)",
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          width="100%"
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              color="inherit"
              onClick={onClose}
              startIcon={<CloseIcon />}
            >
              Close
            </Button>
            {!isRevoked && typeof onRequestRevoke === "function" && (
              <Button
                variant="outlined"
                color="error"
                onClick={() => onRequestRevoke(suspension)}
              >
                Revoke Suspension
              </Button>
            )}
          </Stack>
          <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={sending || isRevoked || !messageInput.trim()}
            startIcon={sending ? <CircularProgress size={16} /> : <SendIcon />}
            sx={{
              background: "#FFD700",
              color: "#2c3e50",
              fontWeight: 600,
              "&:hover": {
                background: "#FFC700",
              },
            }}
          >
            Send Message
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
};

export default SuspensionChatModal;
