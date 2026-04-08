interface FlyLogoProps {
  className?: string
  size?: number
}

export default function FlyLogo({ className = '', size = 36 }: FlyLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Feather / Wing shape */}
      <path
        d="M15 85 C20 70, 35 55, 55 45 C70 37, 85 30, 90 15 C85 25, 75 30, 65 32 C72 22, 80 18, 88 12 C78 18, 65 22, 55 28 C62 18, 72 12, 82 8 C68 15, 52 20, 42 30 C50 20, 62 14, 74 10 C58 18, 42 25, 32 38 C40 28, 52 22, 64 18 C48 28, 32 38, 22 52 C28 42, 40 35, 52 32 C36 44, 22 58, 15 75 Z"
        fill="white"
        opacity="0.95"
      />
      <path
        d="M15 85 Q18 78, 28 68 Q38 58, 50 52 Q62 46, 72 38 Q82 30, 88 18"
        stroke="white"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />
    </svg>
  )
}
