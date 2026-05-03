import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

function SplashScreen({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
        >
          <span
            className="text-foreground font-medium select-none"
            style={{
              fontSize: "1.5rem",
              letterSpacing: "-0.04em",
              lineHeight: 1,
            }}
          >
            CUR8
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function Index() {
  const [splashVisible, setSplashVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setSplashVisible(false), 1500);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <SplashScreen visible={splashVisible} />
      {!splashVisible && <Navigate to="/discover" replace />}
    </>
  );
}
