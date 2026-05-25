import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { trpc } from "@/providers/trpc";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  ChatCircle,
  PaperPlaneTilt,
  ArrowLeft,
  User,
  Clock,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp, fadeInDown, staggerContainer, buttonHover, scaleIn } from "@/lib/motion-variants";

export default function Messages() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);

  const { data: conversations, isLoading: convLoading } =
    trpc.message.getConversations.useQuery(undefined, {
      enabled: isAuthenticated,
    });

  const { data: messages, isLoading: msgLoading } =
    trpc.message.getConversation.useQuery(
      { otherUserId: selectedUser! },
      { enabled: !!selectedUser && isAuthenticated }
    );

  const utils = trpc.useUtils();

  const sendMessage = trpc.message.send.useMutation({
    onSuccess: () => {
      setMessageText("");
      utils.message.getConversation.invalidate({ otherUserId: selectedUser! });
      utils.message.getConversations.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const markAsRead = trpc.message.markAsRead.useMutation({
    onSuccess: () => {
      utils.message.getConversations.invalidate();
    },
  });

  const handleSend = () => {
    if (!messageText.trim() || !selectedUser) return;
    sendMessage.mutate({
      receiverId: selectedUser,
      content: messageText.trim(),
    });
  };

  const handleSelectUser = (userId: number) => {
    setSelectedUser(userId);
    markAsRead.mutate({ senderId: userId });
  };

  if (isLoading) return null;
  if (!isAuthenticated) return null;

  const selectedConversation = conversations?.find((c) => c.partnerId === selectedUser);

  return (
    <motion.div
      className="flex h-[calc(100dvh-3.5rem)] flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="mx-auto flex w-full max-w-[1440px] flex-1 overflow-hidden px-4 py-4">
        {/* Conversations List */}
        <div className={`flex w-full flex-col rounded-2xl border bg-[hsl(var(--surface-elevated))] lg:w-80 lg:shrink-0 ${selectedUser ? "hidden lg:flex" : "flex"}`}>
          <motion.div
            className="shrink-0 border-b p-4"
            style={{ borderColor: "hsl(var(--border) / 0.5)" }}
            initial="hidden"
            animate="visible"
            variants={fadeInDown}
          >
            <h1 className="text-headline text-[1.5rem]">Mensagens</h1>
          </motion.div>
          <div className="flex-1 overflow-y-auto">
            {convLoading ? (
              <div className="space-y-1 p-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-2xl bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : conversations && conversations.length > 0 ? (
              <motion.div
                className="space-y-0.5 p-2"
                initial="hidden"
                animate="visible"
                variants={staggerContainer}
              >
                {conversations.map((conv, i) => (
                  <motion.button
                    key={conv.partnerId}
                    type="button"
                    className={`group w-full rounded-2xl p-3 text-left transition-all duration-200 ${
                      selectedUser === conv.partnerId
                        ? "bg-[hsl(var(--warm-ocean-light))]"
                        : "hover:bg-[hsl(var(--muted) / 0.4)]"
                    }`}
                    onClick={() => handleSelectUser(conv.partnerId)}
                    variants={fadeInUp}
                    custom={i}
                    whileHover={{ x: 4 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-start gap-3">
                      <motion.div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--warm-ocean-light))]"
                        whileHover={{ scale: 1.1 }}
                        transition={{ duration: 0.2 }}
                      >
                        <User weight="duotone" className="h-4 w-4" style={{ color: "hsl(var(--warm-ocean))" }} />
                      </motion.div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-sm font-semibold">{conv.partnerName}</p>
                          {conv.unread && (
                            <motion.span
                              className="ml-2 h-2 w-2 shrink-0 rounded-full"
                              style={{ backgroundColor: "hsl(var(--warm-ocean))" }}
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500, damping: 25 }}
                            />
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-xs" style={{ color: "hsl(var(--text-muted))" }}>
                          {conv.lastMessage}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-[11px]" style={{ color: "hsl(var(--text-muted))" }}>
                          <Clock weight="duotone" className="h-3 w-3" />
                          {new Date(conv.lastMessageTime).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                        </p>
                      </div>
                    </div>
                  </motion.button>
                ))}
              </motion.div>
            ) : (
              <motion.div
                className="flex flex-col items-center justify-center py-16 text-center"
                initial="hidden"
                animate="visible"
                variants={scaleIn}
              >
                <motion.div variants={fadeInUp}>
                  <ChatCircle weight="duotone" className="mb-4 h-10 w-10" style={{ color: "hsl(var(--text-muted))" }} />
                </motion.div>
                <motion.p className="text-body-sm font-medium" variants={fadeInUp}>Nenhuma conversa ainda</motion.p>
                <motion.p className="mt-1 text-body-sm text-pretty" variants={fadeInUp} style={{ color: "hsl(var(--text-muted))" }}>
                  Suas mensagens aparecerão aqui quando você se conectar com outros voluntários e ONGs.
                </motion.p>
              </motion.div>
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className={`flex flex-1 flex-col ${!selectedUser ? "hidden lg:flex" : "flex"}`}>
          {selectedUser && selectedConversation ? (
            <>
              <motion.div
                className="shrink-0 border-b bg-[hsl(var(--surface-elevated))] p-4"
                style={{ borderColor: "hsl(var(--border) / 0.5)" }}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-center gap-3">
                  <motion.button
                    className="btn-warm-ghost rounded-xl p-2 lg:hidden"
                    onClick={() => setSelectedUser(null)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ArrowLeft weight="duotone" className="h-4 w-4" />
                  </motion.button>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[hsl(var(--warm-ocean-light))]">
                    <User weight="duotone" className="h-4 w-4" style={{ color: "hsl(var(--warm-ocean))" }} />
                  </div>
                  <p className="text-title text-[1.125rem]">{selectedConversation.partnerName}</p>
                </div>
              </motion.div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {msgLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="h-10 rounded-2xl bg-muted/50 animate-pulse" />
                    ))}
                  </div>
                ) : messages && messages.length > 0 ? (
                  <AnimatePresence>
                    {messages.map((msg, i) => {
                      const isMine = msg.senderId === user?.id;
                      return (
                        <motion.div
                          key={msg.id}
                          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ duration: 0.3, delay: i * 0.05 }}
                        >
                          <motion.div
                            className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                              isMine
                                ? ""
                                : "bg-[hsl(var(--surface-subtle))]"
                            }`}
                            style={isMine
                              ? {
                                  backgroundColor: "hsl(var(--warm-ocean))",
                                  color: "hsl(var(--primary-foreground))",
                                }
                              : undefined
                            }
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                          >
                            <p className="text-body-sm">{msg.content}</p>
                            <p
                              className="mt-1 text-[11px]"
                              style={{
                                color: isMine
                                  ? "hsl(var(--primary-foreground) / 0.7)"
                                  : "hsl(var(--text-muted))",
                              }}
                            >
                              {new Date(msg.createdAt).toLocaleTimeString("pt-BR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </motion.div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                ) : (
                  <motion.div
                    className="flex flex-1 items-center justify-center text-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p className="text-body-sm" style={{ color: "hsl(var(--text-muted))" }}>
                      Envie a primeira mensagem e dê início à conversa.
                    </p>
                  </motion.div>
                )}
              </div>

              <motion.div
                className="shrink-0 border-t bg-[hsl(var(--surface-elevated))] p-4"
                style={{ borderColor: "hsl(var(--border) / 0.5)" }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <div className="flex gap-2">
                  <motion.input
                    placeholder="Digite sua mensagem..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSend();
                    }}
                    className="input-warm flex-1"
                    whileFocus={{ scale: 1.005, borderColor: "hsl(var(--warm-ocean))" }}
                    transition={{ duration: 0.2 }}
                  />
                  <motion.button
                    onClick={handleSend}
                    disabled={!messageText.trim() || sendMessage.isPending}
                    className="btn-warm-primary rounded-xl disabled:opacity-50"
                    variants={buttonHover}
                    initial="rest"
                    whileHover="hover"
                    whileTap="tap"
                  >
                    <PaperPlaneTilt weight="duotone" className="h-4 w-4" />
                  </motion.button>
                </div>
              </motion.div>
            </>
          ) : (
            <motion.div
              className="flex flex-1 items-center justify-center text-center"
              initial="hidden"
              animate="visible"
              variants={scaleIn}
            >
              <div className="space-y-3">
                <motion.div variants={fadeInUp}>
                  <ChatCircle weight="duotone" className="mx-auto h-14 w-14" style={{ color: "hsl(var(--text-muted))" }} />
                </motion.div>
                <motion.p className="text-body-sm font-medium" variants={fadeInUp}>Selecione uma conversa</motion.p>
                <motion.p className="text-body-sm text-pretty" variants={fadeInUp} style={{ color: "hsl(var(--text-muted))" }}>
                  Escolha uma conversa ao lado para começar a trocar mensagens.
                </motion.p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
