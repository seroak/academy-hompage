import "dotenv/config";
import * as bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const adminUsername = process.env.ADMIN_SEED_USERNAME ?? "admin";
  const adminPassword = process.env.ADMIN_SEED_PASSWORD ?? "admin1234";

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.admin.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      passwordHash,
    },
  });

  const kim = await prisma.instructor.upsert({
    where: { id: "seed-instructor-kim" },
    update: {},
    create: {
      id: "seed-instructor-kim",
      name: "김민준",
      subject: "수학",
      bio: "10년 경력의 수학 전문 강사입니다. 개념 이해와 문제 풀이 전략을 함께 지도합니다.",
    },
  });

  const lee = await prisma.instructor.upsert({
    where: { id: "seed-instructor-lee" },
    update: {},
    create: {
      id: "seed-instructor-lee",
      name: "이서연",
      subject: "영어",
      bio: "원어민 수준의 영어 실력을 바탕으로 독해와 회화를 함께 가르칩니다.",
    },
  });

  const park = await prisma.instructor.upsert({
    where: { id: "seed-instructor-park" },
    update: {},
    create: {
      id: "seed-instructor-park",
      name: "박도윤",
      subject: "과학",
      bio: "실험 중심 수업으로 과학적 사고력을 키우는 것을 목표로 합니다.",
    },
  });

  const courses = [
    {
      id: "seed-course-math-basic",
      title: "중등 수학 기초반",
      description: "중학교 수학의 핵심 개념을 다지는 기초 과정입니다.",
      category: "수학",
      level: "초급",
      tuition: 250000,
      schedule: "월/수/금 16:00-17:30",
      instructorId: kim.id,
    },
    {
      id: "seed-course-math-advanced",
      title: "고등 수학 심화반",
      description: "수능 및 내신 대비를 위한 심화 문제풀이 과정입니다.",
      category: "수학",
      level: "고급",
      tuition: 350000,
      schedule: "화/목 19:00-21:00",
      instructorId: kim.id,
    },
    {
      id: "seed-course-english-conv",
      title: "실전 영어 회화반",
      description: "일상 회화부터 비즈니스 영어까지 실전 중심으로 학습합니다.",
      category: "영어",
      level: "중급",
      tuition: 280000,
      schedule: "월/수 18:00-19:30",
      instructorId: lee.id,
    },
    {
      id: "seed-course-science-exp",
      title: "실험으로 배우는 과학반",
      description: "직접 실험을 통해 과학 개념을 몸으로 익힙니다.",
      category: "과학",
      level: "초급",
      tuition: 300000,
      schedule: "토 10:00-12:00",
      instructorId: park.id,
    },
  ];

  for (const course of courses) {
    await prisma.course.upsert({
      where: { id: course.id },
      update: {},
      create: course,
    });
  }

  const notices = [
    {
      id: "seed-notice-open",
      title: "2026년 상반기 신규 수강생 모집 안내",
      content: "2026년 상반기 신규 수강생을 모집합니다. 자세한 내용은 문의 바랍니다.",
      pinned: true,
    },
    {
      id: "seed-notice-holiday",
      title: "설 연휴 휴원 안내",
      content: "설 연휴 기간 동안 학원은 휴원합니다.",
      pinned: false,
    },
  ];

  for (const notice of notices) {
    await prisma.notice.upsert({
      where: { id: notice.id },
      update: {},
      create: notice,
    });
  }

  const reservations = [
    {
      id: "seed-reservation-1",
      childName: "김하윤",
      childAge: 5,
      parentName: "김지은",
      parentEmail: "parent1@example.com",
      parentPhone: "010-1111-2222",
      preferredSlots: [{ dayOfWeek: "MON", hour: 12 }],
    },
    {
      id: "seed-reservation-2",
      childName: "이도현",
      childAge: 5,
      parentName: "이수진",
      parentEmail: "parent2@example.com",
      parentPhone: "010-2222-3333",
      preferredSlots: [{ dayOfWeek: "MON", hour: 12 }],
    },
    {
      id: "seed-reservation-3",
      childName: "박서아",
      childAge: 6,
      parentName: "박민영",
      parentEmail: "parent3@example.com",
      preferredSlots: [{ dayOfWeek: "WED", hour: 15 }],
    },
    {
      id: "seed-reservation-4",
      childName: "최지호",
      childAge: 4,
      parentName: "최은경",
      parentEmail: "parent4@example.com",
      preferredSlots: [{ dayOfWeek: "FRI", hour: 12 }],
      note: "낯가림이 있어 소규모 그룹을 희망합니다.",
    },
  ];

  for (const reservation of reservations) {
    const { preferredSlots, ...reservationData } = reservation;
    await prisma.reservation.upsert({
      where: { id: reservation.id },
      update: {},
      create: {
        ...reservationData,
        preferredSlots: { create: preferredSlots },
      },
    });
  }

  console.log("Seed completed.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
