import { motion, AnimatePresence } from "framer-motion";
import type { JSX } from "react";

type Props = {
  children: JSX.Element;
  isActive: boolean;
};

export default function FadeUpIn({
  children,
  isActive = true,
}: Props): JSX.Element {
  return (
    <>
      {isActive && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      )}
    </>
  );
}
