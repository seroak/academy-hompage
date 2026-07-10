import ComparisonTable from '../components/math-curriculum/ComparisonTable'
import GrowthTimeline from '../components/math-curriculum/GrowthTimeline'
import MathHero from '../components/math-curriculum/MathHero'
import ProgramCards from '../components/math-curriculum/ProgramCards'
import RecommendationCta from '../components/math-curriculum/RecommendationCta'

export default function MathCurriculumPage() {
  return (
    <div className="pb-1">
      <MathHero />
      <div className="mt-5"><GrowthTimeline /></div>
      <ComparisonTable />
      <ProgramCards />
      <RecommendationCta />
    </div>
  )
}
