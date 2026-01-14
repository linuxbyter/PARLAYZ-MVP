import { useState } from "react";
import { useMessages, useCreateMessage } from "@/hooks/use-messages";
import { MessageCard } from "@/components/MessageCard";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const [inputValue, setInputValue] = useState("");
  const { data: messages, isLoading, error } = useMessages();
  const createMessage = useCreateMessage();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    try {
      await createMessage.mutateAsync({ content: inputValue });
      setInputValue("");
      toast({
        title: "Message sent",
        description: "Your thought has been captured.",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to send message.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 md:p-12">
      <div className="w-full max-w-2xl space-y-12">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="text-center space-y-4"
        >
          <div className="inline-block px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold tracking-wider uppercase mb-2">
            Minimalist Starter
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground">
            Hello World.
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            A clean, minimal canvas for your next big idea. Start by leaving a message below.
          </p>
        </motion.div>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <form onSubmit={handleSubmit} className="relative group">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message here..."
              className="w-full px-6 py-5 rounded-2xl bg-secondary/30 border-2 border-transparent focus:bg-background focus:border-primary/10 focus:shadow-xl focus:shadow-primary/5 outline-none transition-all duration-300 text-lg placeholder:text-muted-foreground/50"
              disabled={createMessage.isPending}
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || createMessage.isPending}
              className="absolute right-3 top-3 bottom-3 aspect-square flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-0 disabled:scale-90 transition-all duration-200 shadow-md shadow-primary/20"
            >
              {createMessage.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </motion.div>

        {/* Messages List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border/40 pb-4">
            <h3 className="text-sm font-semibold text-muted-foreground tracking-wide uppercase">Recent Messages</h3>
            <span className="text-xs text-muted-foreground/60 font-mono">
              {messages?.length || 0} entries
            </span>
          </div>

          <div className="grid gap-4 min-h-[200px]">
            {isLoading ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground/40">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-40 text-destructive/60 bg-destructive/5 rounded-2xl">
                Failed to load messages
              </div>
            ) : messages?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-muted-foreground/40 border border-dashed border-border rounded-2xl">
                <p>No messages yet.</p>
                <p className="text-sm">Be the first to say hello.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {messages?.map((msg, idx) => (
                  <MessageCard key={msg.id} message={msg} index={idx} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
