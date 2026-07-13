import CourseSection from '../components/CourseSection'
import DeferredApplicationGuide from '../components/DeferredApplicationGuide'
import Hero from '../components/Hero'
import ProgramCard from '../components/ProgramCard'
import TrustSection from '../components/TrustSection'

export default function HomePage() {
  return (
    <div className="relative">
      <Hero />
      <ProgramCard />
      <CourseSection />
      <DeferredApplicationGuide />
      <TrustSection />
    </div>
  )
}
