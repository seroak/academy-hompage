import ApplicationGuideSection from '../components/ApplicationGuideSection'
import CourseSection from '../components/CourseSection'
import Hero from '../components/Hero'
import ProgramCard from '../components/ProgramCard'
import TrustSection from '../components/TrustSection'

export default function HomePage() {
  return (
    <div className="relative">
      <Hero />
      <ProgramCard />
      <CourseSection />
      <ApplicationGuideSection />
      <TrustSection />
    </div>
  )
}
