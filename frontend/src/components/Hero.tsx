"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BookOpen, Cloud, Pencil, Rocket, Star } from "lucide-react";

const childrenImagePath = "/images/children_cutout.png";

function Rainbow() {
  return (
    <div className="relative h-16 w-28">
      <div className="absolute inset-x-0 bottom-0 h-14 rounded-t-full border-[10px] border-b-0 border-[#ffd66b]" />
      <div className="absolute inset-x-4 bottom-0 h-10 rounded-t-full border-[10px] border-b-0 border-[#5dadec]" />
      <div className="absolute inset-x-8 bottom-0 h-6 rounded-t-full border-[10px] border-b-0 border-[#6bcb77]" />
      <Cloud className="absolute -bottom-1 -left-2 text-white drop-shadow-sm" size={30} fill="currentColor" />
      <Cloud className="absolute -bottom-1 -right-2 text-white drop-shadow-sm" size={30} fill="currentColor" />
    </div>
  );
}

export default function Hero() {
  const [imageFailed, setImageFailed] = useState(false);
  const router = useRouter();

  function handleReservationClick() {
    router.push("/apply");
  }

  return (
    <section className="relative min-h-[640px] overflow-hidden rounded-[36px] bg-[linear-gradient(135deg,#fff9ec_0%,#fff5dc_50%,#fff0c7_100%)] px-6 pt-16 shadow-[0_24px_80px_rgba(127,88,22,0.08)] sm:px-10 lg:px-16">
      <div className="absolute -bottom-10 -left-16 h-32 w-56 rounded-full bg-[#6bcb77]" />
      <div className="absolute -bottom-4 left-10 h-24 w-44 rounded-full bg-[#7fd98a]" />
      <div className="absolute bottom-0 left-0 right-0 h-24 rounded-t-[80%] bg-[#ffe8a1]" />
      <div className="absolute bottom-0 left-0 h-28 w-[38%] rounded-tr-full bg-[#6bcb77]" />
      <div className="absolute bottom-0 right-0 h-24 w-[34%] rounded-tl-full bg-[#ffe08a]" />

      <motion.div
        className="absolute left-[58%] top-28 hidden lg:block"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Rainbow />
      </motion.div>
      <Rocket className="absolute right-[13%] top-24 hidden rotate-45 text-[#ff8a1f] lg:block" size={58} />
      <Star className="absolute right-16 top-52 hidden text-[#ffd66b] lg:block" size={26} fill="currentColor" />
      <Star className="absolute left-[48%] top-20 hidden text-[#ffd66b] md:block" size={20} fill="currentColor" />
      <BookOpen className="absolute bottom-40 left-[7%] hidden text-[#5dadec] md:block" size={38} />
      <Pencil className="absolute bottom-44 right-[9%] hidden -rotate-12 text-[#6bcb77] md:block" size={42} />

      <div className="relative z-10 grid min-h-[560px] items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="max-w-[560px] pb-28 pt-2 lg:pb-20">
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="mb-5 inline-flex rounded-full bg-white/80 px-4 py-2 text-sm font-black text-[#e86f00] shadow-[0_10px_24px_rgba(255,138,31,0.12)]"
          >
            유치부부터 초등 저학년까지
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.58, ease: "easeOut" }}
            className="text-[clamp(2.25rem,5vw,3.75rem)] font-black leading-[1.18] tracking-[-0.02em] text-[#222222]"
          >
            아이의 오늘이
            <br />
            <span className="text-[#ff8a1f]">미래의 꿈</span>이 됩니다
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16, duration: 0.5, ease: "easeOut" }}
            className="mt-6 max-w-md text-base font-semibold leading-8 text-[#555555] sm:text-lg"
          >
            유치부부터 초등 저학년까지,
            <br />
            재미있는 배움으로 바른 성장을 돕습니다.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24, duration: 0.5, ease: "easeOut" }}
            className="mt-8 flex flex-wrap gap-3"
          >
            <Link
              href="/courses"
              className="inline-flex h-12 items-center justify-center rounded-full bg-[#ff8a1f] px-6 text-sm font-black text-white shadow-[0_16px_30px_rgba(255,138,31,0.28)] transition duration-250 hover:-translate-y-0.5 hover:bg-[#f07800]"
            >
              교육과정 보기
            </Link>
            <button
              type="button"
              onClick={handleReservationClick}
              className="inline-flex h-12 items-center justify-center rounded-full border-2 border-[#ff8a1f] bg-white px-6 text-sm font-black text-[#ff8a1f] transition duration-250 hover:-translate-y-0.5 hover:bg-[#fff4e8]"
            >
              상담 신청하기
            </button>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 24 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: "easeOut" }}
          className="relative self-end pb-24 lg:pb-30"
        >
          {!imageFailed && (
            <Image
              src={childrenImagePath}
              alt="책상 앞에서 웃고 있는 어린이들"
              width={520}
              height={520}
              priority
              onError={() => setImageFailed(true)}
              className="relative z-10 mx-auto h-auto w-full max-w-[520px] object-contain drop-shadow-[0_28px_36px_rgba(77,52,17,0.16)]"
            />
          )}
        </motion.div>
      </div>
    </section>
  );
}
