"use client";
import React, { useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export const Sidebar = ({ items = [], open, setOpen }) => {
  return (
    <>
      <motion.div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white shadow-lg overflow-y-auto",
          !open && "hidden"
        )}
        initial={{ x: -256 }}
        animate={{ x: open ? 0 : -256 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-6">
          {items.map((item, idx) => (
            <motion.div
              key={idx}
              className="py-3 px-4 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              whileHover={{ x: 5 }}
            >
              {item.label}
            </motion.div>
          ))}
        </div>
      </motion.div>
      {open && (
        <motion.div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setOpen?.(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
      )}
    </>
  );
};
