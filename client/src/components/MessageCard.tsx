import { motion } from "framer-motion";
import { type Message } from "@shared/schema";

interface MessageCardProps {
  message: Message;
  index: number;
}

export function MessageCard({ message, index }: MessageCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="group relative p-6 bg-card rounded-2xl border border-border/50 hover:border-primary/20 transition-all duration-300 hover:shadow-lg hover:shadow-black/5"
    >
      <div className="absolute top-4 right-4 text-xs font-mono text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors">
        #{message.id}
      </div>
      <p className="text-foreground/90 font-medium leading-relaxed">
        {message.content}
      </p>
    </motion.div>
  );
}
