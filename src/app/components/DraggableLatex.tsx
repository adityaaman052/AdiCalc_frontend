"use client"; // Ensure it's a client component

import { useRef } from "react";
import dynamic from "next/dynamic";

const Draggable = dynamic(() => import("react-draggable"), { ssr: false });

interface DraggableLatexProps {
  index: number;
  latex: string;
}

const DraggableLatex: React.FC<DraggableLatexProps> = ({  latex }) => {
  const nodeRef = useRef<HTMLElement | null>(null); // Ensure it aligns with HTMLElement

  return (
    <Draggable nodeRef={nodeRef as React.RefObject<HTMLElement>} defaultPosition={{ x: 10, y: 200 }}>
      <div
        ref={(el) => {
          nodeRef.current = el;
        }}
        className="absolute p-2 text-white rounded shadow-md bg-gray-800"
      >
        <div className="latex-content">{latex}</div>
      </div>
    </Draggable>
  );
};

export default DraggableLatex;
