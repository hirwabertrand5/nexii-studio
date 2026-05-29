import React from "react";
import { AnimatePresence, motion } from "framer-motion";

export const pageTransition = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.36, ease: "easeOut" } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.28, ease: "easeIn" } }
};

export function MotionWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div initial="initial" animate="animate" exit="exit" variants={pageTransition}>
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default MotionWrapper;
