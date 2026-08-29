import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #8B7FF7 0%, #4C3FD1 100%)",
        }}
      >
        <svg viewBox="0 0 32 32" width="180" height="180">
          <path
            d="M9 8 L9 19 Q9 23 13 23"
            stroke="white"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          <rect x="13.7" y="13.2" width="2.6" height="2.6" rx="1" fill="#FBBF24" />

          <path
            d="M18 7 L18 23 M18 14 C22.5 14 24.5 16 24.5 18.5 C24.5 21 22.5 23 18 23"
            stroke="white"
            strokeWidth="3.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
