"use client";

import { useEffect, useRef } from "react";

type Props = {
  className?: string;
  children: React.ReactNode;
};

// Sección que aparece (clase `in`) al entrar en el viewport.
export default function Reveal({ className = "", children }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Sin IntersectionObserver el contenido quedaría invisible (opacity 0)
    if (typeof IntersectionObserver === "undefined") {
      el.classList.add("in");
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className={"reveal " + className}>
      {children}
    </section>
  );
}
