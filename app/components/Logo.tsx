import Image from "next/image";

export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <Image
      src="/logo.png"
      alt="recipe"
      width={size}
      height={size}
      className="rounded-[22%]"
      priority
    />
  );
}
