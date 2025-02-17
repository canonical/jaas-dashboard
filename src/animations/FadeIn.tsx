import { motion, AnimatePresence } from "framer-motion";
import type { JSX, PropsWithChildren } from "react";

type Props = {
  className?: string;
  isActive: boolean;
} & PropsWithChildren;

export default function FadeIn({
  children,
  className,
  isActive = true,
}: Props): JSX.Element {
  return (
    <>
      {isActive && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={className}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      )}
    </>
  );
}
