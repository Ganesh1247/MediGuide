import React from "react";

interface GlobalBackgroundProps {
  pointerX: number;
  pointerY: number;
}

export default function GlobalBackground({ pointerX, pointerY }: GlobalBackgroundProps) {
  return (
    <div
      className="global-background"
      style={
        {
          "--pointer-x": `${pointerX}`,
          "--pointer-y": `${pointerY}`,
        } as React.CSSProperties
      }
    >
      <div className="bg-medical-grid" />
      <div className="bg-medical-halo bg-halo-1" />
      <div className="bg-medical-halo bg-halo-2" />
      <div className="bg-medical-halo bg-halo-3" />

      <div className="medical-motif motif-pill" />
      <div className="medical-motif motif-cross" />
      <div className="medical-motif motif-heartbeat" />
      <div className="medical-motif motif-drop" />

      <div className="floating-particle particle-a" />
      <div className="floating-particle particle-b" />
      <div className="floating-particle particle-c" />
      <div className="floating-particle particle-d" />
      <div className="floating-particle particle-e" />
      <div className="floating-particle particle-f" />
    </div>
  );
}
