import { motion, AnimatePresence } from "framer-motion";
import type { JSX } from "react";

type Props = {
  children: JSX.Element;
  className?: string;
  isAnimating: boolean;
};

export default function SlideDownFadeOut({
  children,
  className,
  isAnimating,
}: Props): JSX.Element {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1, y: 0 }}
        animate={isAnimating && { opacity: 0, y: 50 }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
