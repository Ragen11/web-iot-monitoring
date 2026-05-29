import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useOutlet } from "react-router-dom";

/**
 * Bungkus <Outlet /> dengan fade + slight slide-up animation
 * setiap kali route berubah.
 *
 * AnimatePresence + key={pathname} memastikan halaman lama
 * fade out lalu halaman baru fade in.
 */
export default function PageTransition() {
  const location = useLocation();
  const element  = useOutlet();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
      >
        {element}
      </motion.div>
    </AnimatePresence>
  );
}
