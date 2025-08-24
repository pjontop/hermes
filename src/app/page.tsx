'use client';

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import CardNav from '@/components/ui/CardNav/CardNav';
import Beams from '@/components/ui/Beams';
import SplitText from "@/components/ui/SplitText";
import ScrollStack, { ScrollStackItem } from '@/components/ui/ScrollStack/ScrollStack'
import GradientText from '@/components/ui/GradientText'
import CurvedLoop from '@/components/ui/CurvedLoop';
import MagicBento from '@/components/ui/MagicBento'

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  const items = [
    {
      label: "About",
      bgColor: "#0D0716",
      textColor: "#fff",
      links: [
        { label: "Company", ariaLabel: "About Company" },
        { label: "Careers", ariaLabel: "About Careers" }
      ]
    },
    {
      label: "Projects",
      bgColor: "#170D27",
      textColor: "#fff",
      links: [
        { label: "Featured", ariaLabel: "Featured Projects" },
        { label: "Case Studies", ariaLabel: "Project Case Studies" }
      ]
    },
    {
      label: "Contact",
      bgColor: "#271E37",
      textColor: "#fff",
      links: [
        { label: "Email", ariaLabel: "Email us" },
        { label: "Twitter", ariaLabel: "Twitter" },
        { label: "LinkedIn", ariaLabel: "LinkedIn" }
      ]
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <Beams
          beamWidth={2}
          beamHeight={15}
          beamNumber={12}
          lightColor="#ffffff"
          speed={2}
          noiseIntensity={1.75}
          scale={0.2}
          rotation={35}
        />
      </div>
      
      <div className="fixed top-0 left-0 right-0 z-50">
        <CardNav
          logo="/hermesLogo-Homepage.svg"
          logoAlt="Company Logo"
          items={items}
          baseColor="rgba(255, 255, 255, 0.3)"
          menuColor="#000"
          buttonBgColor="#111"
          buttonTextColor="#fff"
          ease="power3.out"
          className="backdrop-blur-md bg-white/20 rounded-xl overflow-hidden"
        />
      </div>
      
      <div className="min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center relative z-10 mb-8">
          <SplitText
            text="Conversations that"
            className="text-white text-8xl font-semibold text-center relative z-10 mb-4"
            delay={70}
            duration={2}
            ease="elastic.out"
            splitType="chars"
            from={{ opacity: 0, y: 40, color: "#ffffff" }}
            to={{ opacity: 1, y: 0, color: "#ffffff" }}
            threshold={0.1}
            rootMargin="-100px"
            textAlign="center"
          />
          <GradientText
            colors={["#40ffaa", "#4079ff", "#40ffaa", "#4079ff", "#40ffaa"]}
            animationSpeed={3}
            showBorder={false}
            className="text-8xl font-semibold mb-8"
          >
            Stay Yours.
          </GradientText>
          <SplitText
            text="Fast, end-to-end encrypted chat with groups, calls, and file sharing. Simple enough for friends. Powerful enough for communities."
            className="text-white/80 text-2xl font-light text-center relative z-10 max-w-4xl mx-auto leading-relaxed"
            delay={100}
            duration={1.5}
            ease="power2.out"
            splitType="words"
            from={{ opacity: 0, y: 20 }}
            to={{ opacity: 1, y: 0 }}
            threshold={0.1}
            rootMargin="-50px"
            textAlign="center"
          />
        </div>

        <MagicBento 
          textAutoHide={true}
          enableStars={true}
          enableSpotlight={true}
          enableBorderGlow={true}
          enableTilt={true}
          enableMagnetism={true}
          clickEffect={true}
          spotlightRadius={300}
          particleCount={12}
          glowColor="132, 0, 255"
          messages={[
            "✨ Your privacy, your rules.",
            "💬 Chat freely with friends & communities.",
            "🔒 End-to-end encryption, always on.",
            "⚡ Fast. Secure. Reliable.",
            "🌍 Built for people, not advertisers."
          ]}
        />
      </div>

      <CurvedLoop 
        marqueeText="Fast ✦ Secure ✦ Reliable ✦ "
        speed={3}
        curveAmount={500}
        direction="right"
        interactive={true}
        className="custom-text-style"
      />

      <div className="h-screen">
        <ScrollStack
          itemDistance={200}
          itemStackDistance={30}
          stackPosition="25%"
          baseScale={0.85}
          className="w-full h-full"
        >
          <ScrollStackItem itemClassName="bg-white">
            <div className="flex items-center justify-between gap-16 h-full">
              <div className="flex-1 space-y-6">
                <h2 className="text-6xl font-bold text-black leading-tight">Text Animations</h2>
                <p className="text-2xl text-gray-700 leading-relaxed">Beautiful, smooth text animations that bring your content to life with elegant transitions and engaging visual effects.</p>
              </div>
              <div className="flex-shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=400"
                  alt="Typography and text animation example"
                  className="w-96 h-48 object-cover rounded-xl"
                />
              </div>
            </div>
          </ScrollStackItem>
          <ScrollStackItem itemClassName="bg-white">
            <div className="flex items-center justify-between gap-16 h-full">
              <div className="flex-1 space-y-6">
                <h2 className="text-6xl font-bold text-black leading-tight">Smooth Scrolling</h2>
                <p className="text-2xl text-gray-700 leading-relaxed">Experience buttery smooth scroll interactions with perfectly timed animations that respond to user behavior.</p>
              </div>
              <div className="flex-shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=400"
                  alt="Digital interface and scrolling experience"
                  className="w-96 h-48 object-cover rounded-xl"
                />
              </div>
            </div>
          </ScrollStackItem>
          <ScrollStackItem itemClassName="bg-white">
            <div className="flex items-center justify-between gap-16 h-full">
              <div className="flex-1 space-y-6">
                <h2 className="text-6xl font-bold text-black leading-tight">Interactive Design</h2>
                <p className="text-2xl text-gray-700 leading-relaxed">Create engaging user experiences with interactive elements that respond beautifully to hover, click, and scroll events.</p>
              </div>
              <div className="flex-shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1586717799252-bd134ad00e26?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&h=400"
                  alt="Interactive design and user interface elements"
                  className="w-96 h-48 object-cover rounded-xl"
                />
              </div>
            </div>
          </ScrollStackItem>
        </ScrollStack>
      </div>
    </div>
  );
}
