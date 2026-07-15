import type { Metadata } from 'next'
import Link from 'next/link'
import Layout from '../../components/Layout'
import { BUSINESS_ADDRESS, BUSINESS_PHONE, SITE_NAME } from '../../lib/seo'

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: `${SITE_NAME} 홈페이지와 광고 상담 과정에서 처리하는 개인정보를 안내합니다.`,
}

const sectionClass = 'scroll-mt-28 border-t border-[#f2dfb9] pt-8'
const headingClass = 'text-xl font-black tracking-[-0.02em] text-[#2b2418] sm:text-2xl'
const paragraphClass = 'mt-3 text-sm font-medium leading-7 text-[#655b4d] sm:text-base'
const tableWrapClass = 'mt-5 overflow-x-auto rounded-2xl border border-[#f2dfb9]'
const tableClass = 'w-full min-w-[680px] border-collapse text-left text-sm text-[#4f4639]'
const headerCellClass = 'bg-[#fff4df] px-4 py-3 font-black text-[#3f3528]'
const cellClass = 'border-t border-[#f2dfb9] px-4 py-3 align-top font-medium leading-6'

export default function PrivacyPage() {
  return (
    <Layout>
      <article className="mx-auto max-w-4xl rounded-[32px] border border-[#f2dfb9] bg-white px-6 py-10 shadow-[0_20px_50px_rgba(95,67,18,0.08)] sm:px-10 sm:py-14">
        <p className="text-sm font-black tracking-[0.08em] text-[#e86f00]">PRIVACY</p>
        <h1 className="mt-3 text-3xl font-black tracking-[-0.03em] text-[#222222] sm:text-4xl">개인정보처리방침</h1>
        <p className="mt-5 text-base font-medium leading-8 text-[#655b4d]">
          {SITE_NAME}은 홈페이지 회원 서비스, 수업 신청과 광고 상담을 운영하는 데 필요한 개인정보를 최소한으로
          처리합니다. 이 방침은 정보가 어떤 목적으로 이용되고 어떻게 보호되는지 안내합니다.
        </p>
        <p className="mt-4 inline-flex rounded-full bg-[#fff4df] px-4 py-2 text-sm font-black text-[#755229]">
          시행일: 2026년 7월 15일
        </p>

        <nav aria-label="개인정보처리방침 목차" className="my-10 rounded-2xl bg-[#fffaf0] p-5">
          <p className="text-sm font-black text-[#3f3528]">주요 항목</p>
          <ol className="mt-3 grid gap-2 text-sm font-bold text-[#765f43] sm:grid-cols-2">
            <li><a className="hover:text-[#e86f00]" href="#purpose">1. 개인정보의 처리 목적</a></li>
            <li><a className="hover:text-[#e86f00]" href="#items">2. 처리하는 개인정보와 보유기간</a></li>
            <li><a className="hover:text-[#e86f00]" href="#meta-lead">3. Meta 광고 상담 정보</a></li>
            <li><a className="hover:text-[#e86f00]" href="#transfer">4. 제3자 제공 및 국외 이전</a></li>
            <li><a className="hover:text-[#e86f00]" href="#destruction">5. 개인정보의 파기</a></li>
            <li><a className="hover:text-[#e86f00]" href="#rights">6. 정보주체의 권리</a></li>
          </ol>
        </nav>

        <div className="grid gap-10">
          <section id="purpose" className={sectionClass}>
            <h2 className={headingClass}>개인정보의 처리 목적</h2>
            <ul className="mt-4 list-disc space-y-2 pl-5 text-sm font-medium leading-7 text-[#655b4d] sm:text-base">
              <li>보호자 회원 가입, 본인 확인, 로그인과 계정 관리</li>
              <li>자녀 정보 관리, 수업 상담·신청 접수와 희망 시간 조정</li>
              <li>신청 결과, 그룹 편성 및 서비스 관련 안내</li>
              <li>Meta 광고를 통한 신규 상담 접수와 연락</li>
            </ul>
          </section>

          <section id="items" className={sectionClass}>
            <h2 className={headingClass}>처리하는 개인정보와 보유기간</h2>
            <div className={tableWrapClass}>
              <table className={tableClass}>
                <thead>
                  <tr>
                    <th className={headerCellClass}>구분</th>
                    <th className={headerCellClass}>처리 항목</th>
                    <th className={headerCellClass}>보유기간</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className={cellClass}>보호자 계정</td>
                    <td className={cellClass}>이름, 이메일, 비밀번호 암호화값, 소셜 로그인 제공자·식별자</td>
                    <td className={cellClass}>회원 탈퇴 또는 삭제 요청 시까지</td>
                  </tr>
                  <tr>
                    <td className={cellClass}>자녀 관리</td>
                    <td className={cellClass}>자녀 이름, 만 나이</td>
                    <td className={cellClass}>자녀 정보 삭제 또는 회원 탈퇴 시까지</td>
                  </tr>
                  <tr>
                    <td className={cellClass}>수업 신청</td>
                    <td className={cellClass}>보호자 이름·이메일·전화번호, 자녀 이름·나이, 희망 시간, 요청사항</td>
                    <td className={cellClass}>신청 철회, 기록 삭제 요청 또는 처리 목적 달성 시까지</td>
                  </tr>
                  <tr>
                    <td className={cellClass}>인증 쿠키</td>
                    <td className={cellClass}>보호자·관리자 로그인 세션</td>
                    <td className={cellClass}>발급 후 최대 7일 또는 로그아웃 시까지</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className={paragraphClass}>관계 법령에서 별도의 보존기간을 정한 경우에는 해당 기간 동안 분리해 보관합니다.</p>
          </section>

          <section id="meta-lead" className={sectionClass}>
            <h2 className={headingClass}>Meta 광고 상담 정보</h2>
            <div className="mt-5 rounded-2xl border border-[#ffd38e] bg-[#fff8eb] p-5 sm:p-6">
              <dl className="grid gap-5 text-sm leading-7 sm:grid-cols-[9rem_1fr] sm:text-base">
                <dt className="font-black text-[#5a4020]">수집 항목</dt>
                <dd className="font-medium text-[#655b4d]">보호자 이름, 휴대전화, 자녀 만 나이, 연락 가능 시간, 통학 가능 여부</dd>
                <dt className="font-black text-[#5a4020]">이용 목적</dt>
                <dd className="font-medium text-[#655b4d]">수업 상담 접수, 연락, 상담 가능 여부 확인</dd>
                <dt className="font-black text-[#5a4020]">보유기간</dt>
                <dd className="font-medium text-[#655b4d]">상담 종료 후 3개월</dd>
              </dl>
            </div>
            <p className={paragraphClass}>
              상담 신청자는 개인정보 수집·이용에 동의하지 않을 수 있습니다. 다만 필수 항목 제공을 거부하면 전화 상담
              접수가 제한될 수 있습니다. 자녀 실명과 상세 시간표는 Meta 즉석 양식에서 수집하지 않습니다.
            </p>
          </section>

          <section id="transfer" className={sectionClass}>
            <h2 className={headingClass}>개인정보의 제3자 제공 및 국외 이전</h2>
            <p className={paragraphClass}>
              학원은 정보주체의 별도 동의나 법률상 근거 없이 개인정보를 제3자에게 제공하지 않습니다. Meta 즉석 양식은
              Meta가 운영하는 플랫폼에서 작성되며, 입력 정보는 Meta를 거쳐 학원에 전달됩니다. Meta의 자체 개인정보 처리와
              국외 이전에 관한 사항은 Meta 개인정보처리방침에서 확인할 수 있습니다.
            </p>
            <Link
              href="https://www.facebook.com/privacy/policy/"
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex font-black text-[#b55b00] underline underline-offset-4 hover:text-[#e86f00]"
            >
              Meta 개인정보처리방침 확인
            </Link>
          </section>

          <section id="destruction" className={sectionClass}>
            <h2 className={headingClass}>개인정보의 파기</h2>
            <p className={paragraphClass}>
              보유기간이 끝나거나 처리 목적을 달성한 개인정보는 지체 없이 파기합니다. 전자적 파일은 복구하기 어려운
              방법으로 삭제하고, 종이 문서는 분쇄하거나 소각합니다. 법령에 따라 보존해야 하는 정보는 다른 정보와 분리해
              보관한 뒤 보존기간이 끝나면 파기합니다.
            </p>
          </section>

          <section id="rights" className={sectionClass}>
            <h2 className={headingClass}>정보주체의 권리와 행사 방법</h2>
            <p className={paragraphClass}>
              정보주체와 법정대리인은 개인정보 열람, 정정, 삭제, 처리정지 및 동의 철회를 요청할 수 있습니다. 아래 연락처로
              요청하면 본인 확인 후 관련 법령이 정한 절차에 따라 처리합니다.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>개인정보 보호 문의</h2>
            <dl className="mt-5 grid gap-3 rounded-2xl bg-[#fffaf0] p-5 text-sm leading-7 sm:grid-cols-[8rem_1fr] sm:text-base">
              <dt className="font-black text-[#3f3528]">담당</dt>
              <dd className="font-medium text-[#655b4d]">{SITE_NAME} 개인정보 보호 담당자</dd>
              <dt className="font-black text-[#3f3528]">전화</dt>
              <dd><a className="font-black text-[#b55b00] underline underline-offset-4" href="tel:01029760166">{BUSINESS_PHONE}</a></dd>
              <dt className="font-black text-[#3f3528]">주소</dt>
              <dd className="font-medium text-[#655b4d]">{BUSINESS_ADDRESS}</dd>
            </dl>
            <p className={paragraphClass}>
              개인정보 침해 상담은 개인정보침해신고센터(국번 없이 118) 또는 개인정보분쟁조정위원회(1833-6972)에도 요청할
              수 있습니다.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>처리방침의 변경</h2>
            <p className={paragraphClass}>
              내용이 변경되면 시행 전에 홈페이지를 통해 안내합니다. 중요한 권리 변경이 있는 경우에는 알아보기 쉬운 방법으로
              별도 안내합니다.
            </p>
          </section>
        </div>
      </article>
    </Layout>
  )
}
