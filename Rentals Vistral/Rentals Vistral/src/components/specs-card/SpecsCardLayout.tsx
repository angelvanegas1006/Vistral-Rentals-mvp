"use client";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ArrowLeft } from "lucide-react";
import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface Property {
  property_unique_id: string;
  address: string;
  city?: string;
  daysInPhase: number;
  currentPhase: string;
}

interface SpecsCardLayoutProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: Property;
  children: ReactNode;
  layoutId?: string;
}

export function SpecsCardLayout({
  open,
  onOpenChange,
  property,
  children,
  layoutId,
}: SpecsCardLayoutProps) {
  const router = useRouter();
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 [&>button]:hidden bg-transparent">
        <DialogTitle className="sr-only">Property Details - {property.address}</DialogTitle>
        <DialogDescription className="sr-only">
          View and edit property specifications and details
        </DialogDescription>
        <AnimatePresence mode="wait">
          {open && (
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ 
                scale: 1, 
                opacity: 1,
                transition: {
                  duration: 0.2,
                  ease: [0.16, 1, 0.3, 1],
                },
              }}
              exit={{ 
                scale: 0.96, 
                opacity: 0,
                transition: {
                  duration: 0.15,
                  ease: [0.16, 1, 0.3, 1],
                },
              }}
              style={{
                transformOrigin: "center center",
              }}
              className="relative max-w-[1600px] h-[90vh] w-[95%] overflow-hidden flex flex-col bg-white rounded-xl shadow-2xl"
            >
              {/* Header Bar - Dedicated space for Back Button to prevent overlap */}
              <div className="absolute top-0 right-0 z-[70] flex h-12 items-center justify-end pr-4">
                {/* Navigation Controls - Back Button (ONLY ONE) */}
                <button
                  onClick={() => router.back()}
                  className="rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="sr-only">Back</span>
                </button>
              </div>

              {/* 3-Column Grid Container - Children will render inside */}
              <div className="flex h-full">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
