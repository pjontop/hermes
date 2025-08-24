import Link from 'next/link'
import FuzzyText from '@/components/ui/FuzzyText';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black">
      <div className="flex flex-col items-center">
        <FuzzyText 
          baseIntensity={0.4}
          hoverIntensity={0.6}
          enableHover={true}
          fontSize="clamp(6rem, 20vw, 16rem)"
          color="#fff"
          fontWeight={900}
        >
          404
        </FuzzyText>
        
        <div className="mt-4">
          <FuzzyText 
            baseIntensity={0.3}
            hoverIntensity={0.5}
            enableHover={true}
            fontSize="clamp(2rem, 8vw, 5rem)"
            color="#fff"
            fontWeight={700}
          >
            not found
          </FuzzyText>
        </div>
      </div>
      
      <Link href="/" className="text-blue-400 hover:text-blue-300 mt-8 text-lg opacity-80 hover:opacity-100 transition-opacity">
        Go back home
      </Link>
    </div>
  )
}