"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Group } from "@mantine/core";
import { Button } from "@/app/components/button";
import DraggableLatex from "@/app/components/DraggableLatex"; // Import the new component

const SWATCHES = [
  "#000000", "#ffffff", "#ee3333", "#e64980", "#be4bdb",
  "#893200", "#228be6", "#3333ee", "#40c057", "#00aa00",
  "#fab005", "#fd7e14"
];

export default function CanvasPage() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [reset, setReset] = useState(false);
  const [dictOfVars, setDictOfVars] = useState<Record<string, string>>({});
  const [latexExpression, setLatexExpression] = useState<string[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8900";

  useEffect(() => {
    if (reset) {
      resetCanvas();
      setLatexExpression([]);
      setDictOfVars({});
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
        const response = await axios.post<{ data: { expr: string; result: string }[] }>(
          `${API_URL}/calculate`,
          {
            image: canvas.toDataURL("image/png"),
            dict_of_vars: dictOfVars,
          }
        );

        const resp = response.data;
        console.log("Response:", resp);

        if (resp.data.length > 0) {
          const newLatex = `\\( ${resp.data[0].expr} = ${resp.data[0].result} \\)`;
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

      {latexExpression.map((latex, index) => (
        <DraggableLatex key={index} index={index} latex={latex} />
      ))}
    </div>
  );
}
