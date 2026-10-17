import Image from "next/image";

/** Logo mark + wordmark; the mark is transparent so it sits on any surface. */
export function Brand({ name = "Finpass" }: { name?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <Image src="/logo-mark.png" alt="" width={28} height={28} quality={100} sizes="28px" className="size-7 object-contain" />
      {name}<span className="-ml-2 text-gain">.</span>
    </span>
  );
}
