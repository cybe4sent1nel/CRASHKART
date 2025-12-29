"use client";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export const CardStack = ({
  items,
  offset = 10,
  scaleFactor = 0.06,
}) => {
  const [cards, setCards] = useState(items);
  const CARD_OFFSET = offset;
  const SCALE_FACTOR = scaleFactor;

  useEffect(() => {
    const interval = setInterval(() => {
      setCards((prevCards) => {
        const newArray = [...prevCards];
        newArray.unshift(newArray.pop());
        return newArray;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-60 w-60 md:h-96 md:w-96">
      {cards.map((card, index) => (
        <motion.div
          key={card.id}
          className={cn(
            "absolute w-60 h-60 md:w-96 md:h-96 rounded-3xl p-4 shadow-xl border border-neutral-200 dark:border-white/[0.1] bg-white dark:bg-black"
          )}
          animate={{
            top: index * -CARD_OFFSET,
            scale: 1 - index * SCALE_FACTOR,
            zIndex: cards.length - index,
          }}
        >
          <div className="font-normal text-neutral-700 dark:text-neutral-200">
            {card.content}
          </div>
          <div className="text-lg font-medium text-neutral-900 dark:text-white mt-4">
            {card.name}
          </div>
          <div className="text-sm text-neutral-500">{card.designation}</div>
        </motion.div>
      ))}
    </div>
  );
};
