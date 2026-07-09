import "dotenv/config";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const configService = new ConfigService();

async function main() {
  const adminUsername = configService.get<string>("ADMIN_SEED_USERNAME", "admin");
  const adminPassword = configService.get<string>("ADMIN_SEED_PASSWORD", "admin1234");

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
      preferredSlots: [{ dayOfWeek: "MON", startMinute: 720, endMinute: 790 }],
    },
    {
      id: "seed-reservation-2",
      childName: "이도현",
      childAge: 5,
      parentName: "이수진",
      parentEmail: "parent2@example.com",
      parentPhone: "010-2222-3333",
      preferredSlots: [{ dayOfWeek: "MON", startMinute: 720, endMinute: 810 }],
    },
    {
      id: "seed-reservation-3",
      childName: "박서아",
      childAge: 6,
      parentName: "박민영",
      parentEmail: "parent3@example.com",
      preferredSlots: [{ dayOfWeek: "WED", startMinute: 900, endMinute: 970 }],
    },
    {
      id: "seed-reservation-4",
      childName: "최지호",
      childAge: 4,
      parentName: "최은경",
      parentEmail: "parent4@example.com",
      preferredSlots: [{ dayOfWeek: "FRI", startMinute: 720, endMinute: 810 }],
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

  // 여석이 남은 확정 그룹 하나를 시드해, 관리자 편입/학부모 합류 UI를 시드 직후 바로 확인할 수 있게 한다.
  const groupedMembers = [
    {
      id: "seed-reservation-grouped-1",
      childName: "정하은",
      childAge: 5,
      parentName: "정미란",
      parentEmail: "parent5@example.com",
      parentPhone: "010-5555-6666",
      preferredSlots: [{ dayOfWeek: "TUE", startMinute: 720, endMinute: 790 }],
    },
    {
      id: "seed-reservation-grouped-2",
      childName: "한소율",
      childAge: 6,
      parentName: "한지원",
      parentEmail: "parent6@example.com",
      preferredSlots: [{ dayOfWeek: "TUE", startMinute: 720, endMinute: 790 }],
    },
  ];

  for (const reservation of groupedMembers) {
    const { preferredSlots, ...reservationData } = reservation;
    await prisma.reservation.upsert({
      where: { id: reservation.id },
      update: {},
      create: {
        ...reservationData,
        status: "GROUPED",
        preferredSlots: { create: preferredSlots },
      },
    });
  }

  const seedGroup = await prisma.reservationGroup.upsert({
    where: { id: "seed-group-tuesday" },
    update: {},
    create: {
      id: "seed-group-tuesday",
      label: "화요일 12시반",
      capacity: 4,
      minAge: 5,
      maxAge: 6,
    },
  });

  for (const reservation of groupedMembers) {
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: { groupId: seedGroup.id },
    });
    await prisma.reservationGroupSlot.upsert({
      where: { id: `${reservation.id}-slot` },
      update: {},
      create: {
        id: `${reservation.id}-slot`,
        groupId: seedGroup.id,
        reservationId: reservation.id,
        dayOfWeek: "TUE",
        startMinute: 720,
        endMinute: 790,
      },
    });
  }

  const levelTestQuestions = [
    {
      id: "seed-level-test-q-age5-mc-1",
      age: 5,
      type: "MULTIPLE_CHOICE" as const,
      prompt: "다음 중 과일은 무엇일까요?",
      choices: ["사과", "자동차", "의자"],
      correctChoiceIndex: 0,
    },
    {
      id: "seed-level-test-q-age5-mc-2",
      age: 5,
      type: "MULTIPLE_CHOICE" as const,
      prompt: "1, 2, 3 다음에 오는 숫자는?",
      choices: ["4", "5", "6"],
      correctChoiceIndex: 0,
    },
    {
      id: "seed-level-test-q-age5-short-1",
      age: 5,
      type: "SHORT_ANSWER" as const,
      prompt: "좋아하는 동물과 그 이유를 말해 주세요.",
      choices: [],
    },
    {
      id: "seed-level-test-q-age7-mc-1",
      age: 7,
      type: "MULTIPLE_CHOICE" as const,
      prompt: "'Apple'을 우리말로 하면?",
      choices: ["사과", "바나나", "포도"],
      correctChoiceIndex: 0,
    },
    {
      id: "seed-level-test-q-age7-mc-2",
      age: 7,
      type: "MULTIPLE_CHOICE" as const,
      prompt: "7 + 5는?",
      choices: ["11", "12", "13"],
      correctChoiceIndex: 1,
    },
    {
      id: "seed-level-test-q-age7-short-1",
      age: 7,
      type: "SHORT_ANSWER" as const,
      prompt: "오늘 하루 중 가장 재미있었던 일을 적어 주세요.",
      choices: [],
    },
  ];

  for (const question of levelTestQuestions) {
    await prisma.levelTestQuestion.upsert({
      where: { id: question.id },
      update: {},
      create: question,
    });
  }

  const levelTestAgeConfigs = [
    { age: 5, drawCount: 3 },
    { age: 7, drawCount: 2 },
  ];

  for (const config of levelTestAgeConfigs) {
    await prisma.levelTestAgeConfig.upsert({
      where: { age: config.age },
      update: {},
      create: config,
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
