"use client";
import React, { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export const FloatingDock = ({ items, desktopClassName, mobileClassName }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      <motion.div
        initial={{ y: 100 }}
        whileInView={{ y: 0 }}
        transition={{ duration: 0.3 }}
        className={cn(
          "fixed bottom-8 left-1/2 -translate-x-1/2 hidden md:flex items-center justify-center z-50",
          desktopClassName
        )}
      >
        <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-white dark:bg-slate-900 shadow-lg border border-gray-200 dark:border-slate-700">
          {items.map((item, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.95 }}
              className="cursor-pointer"
            >
              {item.icon}
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        className={cn("fixed bottom-8 right-8 md:hidden z-50", mobileClassName)}
      >
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg"
        >
          +
        </motion.button>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute bottom-16 right-0 flex flex-col gap-3"
          >
            {items.map((item, idx) => (
              <motion.div
                key={idx}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center cursor-pointer"
              >
                {item.icon}
              </motion.div>
            ))}
          </motion.div>
        )}
      </motion.div>
    </>
  );
};
