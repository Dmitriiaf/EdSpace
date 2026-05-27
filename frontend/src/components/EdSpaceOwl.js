// ========== frontend/src/components/EdSpaceOwl.js ==========
import React from "react";

export default function EdSpaceOwl({ state = "idle", size = 240 }) {
  const isSleeping = state === "sleeping";
  const isLoading = state === "loading";
  const isHappy = state === "happy";

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 240 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <style>
          {`
            .owl-body {
              animation: bodyFloat 3s ease-in-out infinite;
              transform-origin: center;
            }

            .owl-head {
              animation: headRotate 5s ease-in-out infinite;
              transform-origin: center 95px;
            }

            .owl-eye {
              animation: blink 3s infinite;
              transform-origin: center;
            }

            .wing-left,
            .wing-right {
              transform-origin: center;
            }

            .loading .wing-left {
              animation: flapLeft 0.6s ease-in-out infinite;
            }

            .loading .wing-right {
              animation: flapRight 0.6s ease-in-out infinite;
            }

            .happy {
              animation: jump 0.8s ease-in-out infinite;
            }

            .sleeping .owl-head {
              animation: none;
              transform: rotate(-15deg);
            }

            .sleeping .owl-eye {
              animation: none;
            }

            @keyframes blink {
              0%, 92%, 100% {
                transform: scaleY(1);
              }
              95% {
                transform: scaleY(0.05);
              }
            }

            @keyframes headRotate {
              0% {
                transform: rotate(-15deg);
              }
              50% {
                transform: rotate(15deg);
              }
              100% {
                transform: rotate(-15deg);
              }
            }

            @keyframes bodyFloat {
              0%, 100% {
                transform: translateY(0px);
              }
              50% {
                transform: translateY(-4px);
              }
            }

            @keyframes flapLeft {
              0%, 100% {
                transform: rotate(0deg);
              }
              50% {
                transform: rotate(-25deg);
              }
            }

            @keyframes flapRight {
              0%, 100% {
                transform: rotate(0deg);
              }
              50% {
                transform: rotate(25deg);
              }
            }

            @keyframes jump {
              0%, 100% {
                transform: translateY(0px);
              }
              30% {
                transform: translateY(-22px);
              }
              50% {
                transform: translateY(-18px);
              }
              70% {
                transform: translateY(-8px);
              }
            }
          `}
        </style>

        <g
          className={[
            "owl-body",
            isLoading ? "loading" : "",
            isHappy ? "happy" : "",
            isSleeping ? "sleeping" : "",
          ].join(" ")}
        >
          {/* Тень под совой */}
          <ellipse
            cx="120"
            cy="220"
            rx="40"
            ry="8"
            fill="#E5E7EB"
            opacity="0.5"
          />

          {/* Тело */}
          <ellipse
            cx="120"
            cy="145"
            rx="62"
            ry="72"
            fill="#4F46E5"
          />

          {/* Левое крыло */}
          <ellipse
            className="wing-left"
            cx="62"
            cy="145"
            rx="24"
            ry="48"
            fill="#4338CA"
          />

          {/* Правое крыло */}
          <ellipse
            className="wing-right"
            cx="178"
            cy="145"
            rx="24"
            ry="48"
            fill="#4338CA"
          />

          {/* Живот */}
          <ellipse
            cx="120"
            cy="155"
            rx="36"
            ry="46"
            fill="white"
          />

          {/* Лапки */}
          <rect x="92" y="208" width="14" height="10" rx="4" fill="#FACC15" />
          <rect x="134" y="208" width="14" height="10" rx="4" fill="#FACC15" />

          {/* Голова */}
          <g className="owl-head">
            {/* Форма головы */}
            <circle cx="120" cy="90" r="54" fill="#4F46E5" />

            {/* Ушки */}
            <polygon
              points="82,52 98,20 112,56"
              fill="#4F46E5"
            />
            <polygon
              points="128,56 142,20 158,52"
              fill="#4F46E5"
            />

            {/* Лицевой диск */}
            <ellipse
              cx="120"
              cy="92"
              rx="36"
              ry="34"
              fill="white"
              opacity="0.9"
            />

            {/* Глаза */}
            {!isSleeping ? (
              <>
                {/* Левый глаз */}
                <g className="owl-eye">
                  <circle cx="96" cy="92" r="18" fill="white" />
                  <circle cx="96" cy="92" r="9" fill="#FACC15" />
                  <circle cx="96" cy="92" r="4" fill="#111827" />
                  {/* Блик */}
                  <circle cx="93" cy="89" r="1.5" fill="white" />
                </g>

                {/* Правый глаз */}
                <g className="owl-eye">
                  <circle cx="144" cy="92" r="18" fill="white" />
                  <circle cx="144" cy="92" r="9" fill="#FACC15" />
                  <circle cx="144" cy="92" r="4" fill="#111827" />
                  {/* Блик */}
                  <circle cx="141" cy="89" r="1.5" fill="white" />
                </g>
              </>
            ) : (
              <>
                {/* Закрытые глаза (спящий режим) */}
                <line
                  x1="82"
                  y1="92"
                  x2="110"
                  y2="92"
                  stroke="#111827"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <line
                  x1="130"
                  y1="92"
                  x2="158"
                  y2="92"
                  stroke="#111827"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </>
            )}

            {/* Клюв */}
            <polygon
              points="120,108 110,124 130,124"
              fill="#F59E0B"
            />
          </g>
        </g>
      </svg>
    </div>
  );
}