"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import dynamic from "next/dynamic";
import { Group } from "@mantine/core";
import { Button } from "@/app/components/button";

// ✅ Load Draggable dynamically to prevent Next.js hydration errors
const Draggable = dynamic(() => import("react-draggable"), { ssr: false });

const SWATCHES = [
  "#000000", "#ffffff", "#ee3333", "#e64980", "#be4bdb",
  "#893200", "#228be6", "#3333ee", "#40c057", "#00aa00",
  "#fab005", "#fd7e14"
];

interface GeneratedResult {
  expression: string;
  answer: string;
}

export default function CanvasPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [reset, setReset] = useState(false);
  const [dictOfVars, setDictOfVars] = useState({});
  const [latexExpression, setLatexExpression] = useState<string[]>([]);
  
  // ✅ Fix: Store refs in state *before rendering*
  const [latexRefs, setLatexRefs] = useState<React.RefObject<HTMLDivElement>[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8900";

  useEffect(() => {
    if (reset) {
      resetCanvas();
      setLatexExpression([]);
      setDictOfVars({});
      setLatexRefs([]); // ✅ Reset refs when clearing
      setReset(false);
    }
  }, [reset]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        ctx.lineCap = "round";
        ctx.lineWidth = 3;
      }
    }
  }, []);

  const resetCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.strokeStyle = color;
        setIsDrawing(true);
      }
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();
      }
    }
  };

  const stopDrawing = () => setIsDrawing(false);

  const runRoute = async () => {
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        const response = await axios.post(`${API_URL}/calculate`, {
          image: canvas.toDataURL("image/png"),
          dict_of_vars: dictOfVars,
        });

        const resp = response.data;
        console.log("Response:", resp);

        if (resp.data.length > 0) {
          const newLatex = `\\( ${resp.data[0].expr} = ${resp.data[0].result} \\)`;

          // ✅ Fix: Update refs inside state, not hooks
          setLatexRefs((prevRefs) => [...prevRefs, { current: null }]);

          setLatexExpression((prevLatex) => [...prevLatex, newLatex]);
        }
      } catch (error) {
        console.error("Error calling API:", error);
      }
    }
  };

  return (
    <div className="relative h-screen w-screen bg-gray-900">
      <div className="grid grid-cols-3 gap-4 p-4 z-50">
        <Button onClick={() => setReset(true)} className="z-20 bg-black text-white">
          Reset
        </Button>
        <Group className="z-20 flex flex-wrap justify-center bg-gray-800 p-2 rounded-lg">
          {SWATCHES.map((swatch) => (
            <div
              key={swatch}
              className={`w-8 h-8 rounded-full cursor-pointer border-2 ${
                color === swatch ? "border-white" : "border-transparent"
              }`}
              style={{ backgroundColor: swatch }}
              onClick={() => setColor(swatch)}
            />
          ))}
        </Group>
        <Button onClick={runRoute} className="z-20 bg-black text-white">
          Run
        </Button>
      </div>

      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseOut={stopDrawing}
      />

      {latexExpression.map((latex, index) => {
        if (!latexRefs[index]) return null; // ✅ Ensure ref exists before using it

        return (
          <Draggable key={index} nodeRef={latexRefs[index]} defaultPosition={{ x: 10, y: 200 }}>
            <div ref={latexRefs[index]} className="absolute p-2 text-white rounded shadow-md bg-gray-800">
              <div className="latex-content">{latex}</div>
            </div>
          </Draggable>
        );
      })}
    </div>
  );
}
