import 'dotenv/config';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const configService = new ConfigService();

async function main() {
  const adminUsername = configService.get<string>(
    'ADMIN_SEED_USERNAME',
    'admin',
  );
  const adminPassword = configService.get<string>(
    'ADMIN_SEED_PASSWORD',
    'admin1234',
  );

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await prisma.admin.upsert({
    where: { username: adminUsername },
    update: {},
    create: {
      username: adminUsername,
      passwordHash,
      role: 'SUPER_ADMIN',
    },
  });

  const kim = await prisma.instructor.upsert({
    where: { id: 'seed-instructor-kim' },
    update: {},
    create: {
      id: 'seed-instructor-kim',
      name: '김민준',
      subject: '수학',
      bio: '10년 경력의 수학 전문 강사입니다. 개념 이해와 문제 풀이 전략을 함께 지도합니다.',
    },
  });

  const lee = await prisma.instructor.upsert({
    where: { id: 'seed-instructor-lee' },
    update: {},
    create: {
      id: 'seed-instructor-lee',
      name: '이서연',
      subject: '영어',
      bio: '원어민 수준의 영어 실력을 바탕으로 독해와 회화를 함께 가르칩니다.',
    },
  });

  const park = await prisma.instructor.upsert({
    where: { id: 'seed-instructor-park' },
    update: {},
    create: {
      id: 'seed-instructor-park',
      name: '박도윤',
      subject: '과학',
      bio: '실험 중심 수업으로 과학적 사고력을 키우는 것을 목표로 합니다.',
    },
  });

  const courses = [
    {
      id: 'seed-course-math-basic',
      title: '중등 수학 기초반',
      description: '중학교 수학의 핵심 개념을 다지는 기초 과정입니다.',
      category: '수학',
      level: '초급',
      tuition: 250000,
      schedule: '월/수/금 16:00-17:30',
      instructorId: kim.id,
    },
    {
      id: 'seed-course-math-advanced',
      title: '고등 수학 심화반',
      description: '수능 및 내신 대비를 위한 심화 문제풀이 과정입니다.',
      category: '수학',
      level: '고급',
      tuition: 350000,
      schedule: '화/목 19:00-21:00',
      instructorId: kim.id,
    },
    {
      id: 'seed-course-english-conv',
      title: '실전 영어 회화반',
      description: '일상 회화부터 비즈니스 영어까지 실전 중심으로 학습합니다.',
      category: '영어',
      level: '중급',
      tuition: 280000,
      schedule: '월/수 18:00-19:30',
      instructorId: lee.id,
    },
    {
      id: 'seed-course-science-exp',
      title: '실험으로 배우는 과학반',
      description: '직접 실험을 통해 과학 개념을 몸으로 익힙니다.',
      category: '과학',
      level: '초급',
      tuition: 300000,
      schedule: '토 10:00-12:00',
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
      id: 'seed-notice-open',
      title: '2026년 상반기 신규 수강생 모집 안내',
      content:
        '2026년 상반기 신규 수강생을 모집합니다. 자세한 내용은 문의 바랍니다.',
      pinned: true,
    },
    {
      id: 'seed-notice-holiday',
      title: '설 연휴 휴원 안내',
      content: '설 연휴 기간 동안 학원은 휴원합니다.',
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
      id: 'seed-reservation-1',
      childName: '김도윤',
      childAge: 5,
      parentName: '김영진',
      parentEmail: 'parent1@example.com',
      parentPhone: '010-1234-5678',
      preferredSlots: [{ dayOfWeek: 'MON', startMinute: 900, endMinute: 950 }],
    },
    {
      id: 'seed-reservation-2',
      childName: '우필립',
      childAge: 6,
      parentName: '우성민',
      parentEmail: 'parent2@example.com',
      parentPhone: '010-2345-6789',
      preferredSlots: [
        { dayOfWeek: 'MON', startMinute: 1040, endMinute: 1090 },
      ],
    },
    {
      id: 'seed-reservation-3',
      childName: '김하윤',
      childAge: 5,
      parentName: '김태호',
      parentEmail: 'parent3@example.com',
      parentPhone: '010-3456-7890',
      preferredSlots: [{ dayOfWeek: 'TUE', startMinute: 840, endMinute: 890 }],
    },
    {
      id: 'seed-reservation-4',
      childName: '김민아',
      childAge: 7,
      parentName: '김수현',
      parentEmail: 'parent4@example.com',
      parentPhone: '010-4567-8901',
      preferredSlots: [{ dayOfWeek: 'TUE', startMinute: 930, endMinute: 1000 }],
    },
    {
      id: 'seed-reservation-5',
      childName: '배윤재',
      childAge: 6,
      parentName: '배동석',
      parentEmail: 'parent5@example.com',
      parentPhone: '010-5678-9012',
      preferredSlots: [{ dayOfWeek: 'TUE', startMinute: 930, endMinute: 1000 }],
    },
    {
      id: 'seed-reservation-6',
      childName: '배아현',
      childAge: 5,
      parentName: '배지연',
      parentEmail: 'parent6@example.com',
      parentPhone: '010-6789-0123',
      preferredSlots: [
        { dayOfWeek: 'TUE', startMinute: 1050, endMinute: 1120 },
      ],
    },
    {
      id: 'seed-reservation-7',
      childName: '박서은',
      childAge: 6,
      parentName: '박정훈',
      parentEmail: 'parent7@example.com',
      parentPhone: '010-7890-1234',
      preferredSlots: [
        { dayOfWeek: 'TUE', startMinute: 1010, endMinute: 1060 },
      ],
    },
    {
      id: 'seed-reservation-8',
      childName: '이하이',
      childAge: 5,
      parentName: '이준석',
      parentEmail: 'parent8@example.com',
      parentPhone: '010-8901-2345',
      preferredSlots: [
        { dayOfWeek: 'TUE', startMinute: 1010, endMinute: 1060 },
      ],
    },
    {
      id: 'seed-reservation-9',
      childName: '정하율',
      childAge: 7,
      parentName: '정민철',
      parentEmail: 'parent9@example.com',
      parentPhone: '010-9012-3456',
      preferredSlots: [{ dayOfWeek: 'WED', startMinute: 780, endMinute: 830 }],
    },
    {
      id: 'seed-reservation-10',
      childName: '최하은',
      childAge: 5,
      parentName: '최성우',
      parentEmail: 'parent10@example.com',
      parentPhone: '010-0123-4567',
      preferredSlots: [{ dayOfWeek: 'WED', startMinute: 870, endMinute: 920 }],
    },
    {
      id: 'seed-reservation-11',
      childName: '최서은',
      childAge: 6,
      parentName: '최진호',
      parentEmail: 'parent11@example.com',
      parentPhone: '010-1122-3344',
      preferredSlots: [{ dayOfWeek: 'WED', startMinute: 930, endMinute: 980 }],
    },
    {
      id: 'seed-reservation-12',
      childName: '김도혜',
      childAge: 6,
      parentName: '김상현',
      parentEmail: 'parent12@example.com',
      parentPhone: '010-2233-4455',
      preferredSlots: [{ dayOfWeek: 'THU', startMinute: 900, endMinute: 970 }],
    },
    {
      id: 'seed-reservation-13',
      childName: '이봄',
      childAge: 5,
      parentName: '이영미',
      parentEmail: 'parent13@example.com',
      parentPhone: '010-3344-5566',
      preferredSlots: [{ dayOfWeek: 'THU', startMinute: 900, endMinute: 970 }],
    },
    {
      id: 'seed-reservation-14',
      childName: '최수아',
      childAge: 7,
      parentName: '최동건',
      parentEmail: 'parent14@example.com',
      parentPhone: '010-4455-6677',
      preferredSlots: [
        { dayOfWeek: 'THU', startMinute: 1030, endMinute: 1100 },
      ],
    },
    {
      id: 'seed-reservation-15',
      childName: '한다경',
      childAge: 6,
      parentName: '한지훈',
      parentEmail: 'parent15@example.com',
      parentPhone: '010-5566-7788',
      preferredSlots: [
        { dayOfWeek: 'THU', startMinute: 1030, endMinute: 1100 },
      ],
    },
    {
      id: 'seed-reservation-16',
      childName: '김도담',
      childAge: 5,
      parentName: '김명수',
      parentEmail: 'parent16@example.com',
      parentPhone: '010-6677-8899',
      preferredSlots: [{ dayOfWeek: 'FRI', startMinute: 840, endMinute: 890 }],
    },
    {
      id: 'seed-reservation-17',
      childName: '김지후',
      childAge: 6,
      parentName: '김태영',
      parentEmail: 'parent17@example.com',
      parentPhone: '010-7788-9900',
      preferredSlots: [{ dayOfWeek: 'FRI', startMinute: 930, endMinute: 980 }],
    },
    {
      id: 'seed-reservation-18',
      childName: '한재섭',
      childAge: 7,
      parentName: '한승우',
      parentEmail: 'parent18@example.com',
      parentPhone: '010-8899-0011',
      preferredSlots: [
        { dayOfWeek: 'FRI', startMinute: 1000, endMinute: 1050 },
      ],
    },
    {
      id: 'seed-reservation-19',
      childName: '조세록',
      childAge: 5,
      parentName: '조진혁',
      parentEmail: 'parent19@example.com',
      parentPhone: '010-9900-1122',
      preferredSlots: [
        { dayOfWeek: 'FRI', startMinute: 1000, endMinute: 1050 },
      ],
    },
    {
      id: 'seed-reservation-20',
      childName: '김하늘',
      childAge: 6,
      parentName: '김우빈',
      parentEmail: 'parent20@example.com',
      parentPhone: '010-1010-2020',
      preferredSlots: [
        { dayOfWeek: 'FRI', startMinute: 1070, endMinute: 1120 },
      ],
    },
  ];

  for (const reservation of reservations) {
    const { preferredSlots, ...reservationData } = reservation;
    await prisma.reservation.upsert({
      where: { id: reservation.id },
      update: { status: 'WAITING', groupId: null },
      create: {
        ...reservationData,
        preferredSlots: { create: preferredSlots },
      },
    });
  }

  const groupsBySlot = new Map<string, typeof reservations>();
  for (const r of reservations) {
    const slot = r.preferredSlots[0];
    const key = `${slot.dayOfWeek}-${slot.startMinute}-${slot.endMinute}`;
    if (!groupsBySlot.has(key)) {
      groupsBySlot.set(key, []);
    }
    groupsBySlot.get(key)!.push(r);
  }

  let groupIndex = 1;
  for (const [key, members] of groupsBySlot.entries()) {
    const slot = members[0].preferredSlots[0];
    const groupId = `seed-group-auto-${groupIndex++}`;
    const minAge = Math.min(...members.map((m) => m.childAge));
    const maxAge = Math.max(...members.map((m) => m.childAge));

    const dayLabels: Record<string, string> = {
      MON: '월',
      TUE: '화',
      WED: '수',
      THU: '목',
      FRI: '금',
    };
    const label = `${dayLabels[slot.dayOfWeek]}요일 ${Math.floor(slot.startMinute / 60)}시 ${slot.startMinute % 60 === 0 ? '정각' : (slot.startMinute % 60) + '분'}반`;

    const capacity = members.length === 2 ? 3 : 4;

    await prisma.reservationGroup.upsert({
      where: { id: groupId },
      update: {},
      create: {
        id: groupId,
        label,
        capacity,
        minAge,
        maxAge,
      },
    });

    for (const member of members) {
      await prisma.reservation.update({
        where: { id: member.id },
        data: {
          status: 'GROUPED',
          groupId: groupId,
        },
      });
      await prisma.reservationGroupSlot.upsert({
        where: { id: `${member.id}-slot-auto` },
        update: {},
        create: {
          id: `${member.id}-slot-auto`,
          groupId,
          reservationId: member.id,
          dayOfWeek: slot.dayOfWeek,
          startMinute: slot.startMinute,
          endMinute: slot.endMinute,
        },
      });
    }
  }

  // 여석이 남은 확정 그룹 하나를 시드해, 관리자 편입/학부모 합류 UI를 시드 직후 바로 확인할 수 있게 한다.

  const seedGroup = await prisma.reservationGroup.upsert({
    where: { id: 'seed-group-tuesday' },
    update: {},
    create: {
      id: 'seed-group-tuesday',
      label: '화요일 1시',
      capacity: 4,
      minAge: 5,
      maxAge: 6,
    },
  });

  const levelTestQuestions = [
    {
      id: 'seed-level-test-q-age5-mc-1',
      age: 5,
      type: 'MULTIPLE_CHOICE' as const,
      prompt: '다음 중 과일은 무엇일까요?',
      choices: ['사과', '자동차', '의자'],
      correctChoiceIndex: 0,
    },
    {
      id: 'seed-level-test-q-age5-mc-2',
      age: 5,
      type: 'MULTIPLE_CHOICE' as const,
      prompt: '1, 2, 3 다음에 오는 숫자는?',
      choices: ['4', '5', '6'],
      correctChoiceIndex: 0,
    },
    {
      id: 'seed-level-test-q-age5-short-1',
      age: 5,
      type: 'SHORT_ANSWER' as const,
      prompt: '좋아하는 동물과 그 이유를 말해 주세요.',
      choices: [],
    },
    {
      id: 'seed-level-test-q-age7-mc-1',
      age: 7,
      type: 'MULTIPLE_CHOICE' as const,
      prompt: "'Apple'을 우리말로 하면?",
      choices: ['사과', '바나나', '포도'],
      correctChoiceIndex: 0,
    },
    {
      id: 'seed-level-test-q-age7-mc-2',
      age: 7,
      type: 'MULTIPLE_CHOICE' as const,
      prompt: '7 + 5는?',
      choices: ['11', '12', '13'],
      correctChoiceIndex: 1,
    },
    {
      id: 'seed-level-test-q-age7-short-1',
      age: 7,
      type: 'SHORT_ANSWER' as const,
      prompt: '오늘 하루 중 가장 재미있었던 일을 적어 주세요.',
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

  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
