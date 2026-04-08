import Image from 'next/image'

export default function WatermarkBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 flex items-center justify-center overflow-hidden"
      aria-hidden="true"
    >
      <Image
        src="/logo-bg.png"
        alt=""
        width={700}
        height={700}
        className="w-[80vw] max-w-[700px] select-none object-contain opacity-[0.05]"
      />
    </div>
  )
}
