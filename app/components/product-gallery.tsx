"use client";

import Image from "next/image";
import { useState } from "react";

export default function ProductGallery({
  name,
  images,
}: {
  name: string;
  images: [string, ...string[]];
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const activeImage = images[selectedIndex] ?? images[0];
  const hasThumbnails = images.length > 1;

  return (
    <div className="min-w-0 rounded-[32px] border border-[#e4eddc] bg-[#f0f5e9] p-4 sm:p-5">
      <Image
        src={activeImage}
        alt={hasThumbnails ? `${name} – ảnh ${selectedIndex + 1}` : name}
        width={640}
        height={640}
        loading="eager"
        fetchPriority={selectedIndex === 0 ? "high" : "auto"}
        sizes="(max-width: 767px) 90vw, (max-width: 1200px) 55vw, 640px"
        className="block h-auto w-full rounded-[24px] bg-white"
      />

      {hasThumbnails && (
        <ul aria-label={`Ảnh của ${name}`} className="mt-3 flex flex-wrap gap-2">
          {images.map((image, index) => (
            <li key={image}>
              <button
                type="button"
                aria-label={`Xem ảnh ${index + 1} trên ${images.length}`}
                aria-pressed={selectedIndex === index}
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse") setSelectedIndex(index);
                }}
                onClick={() => setSelectedIndex(index)}
                className="relative block size-14 overflow-hidden rounded-xl border-2 border-[#dce8d8] bg-white hover:border-[#245c45] aria-pressed:border-[#245c45] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#245c45] sm:size-16"
              >
                <Image src={image} alt="" fill sizes="(min-width: 640px) 64px, 56px" className="object-contain p-0.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
