//@ts-nocheck

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";
import { ArrowRight, Lock, Shield, UserCheck, Zap, Mail, Star, ChevronRight, Eye, Award } from 'lucide-react';
import { useAppKitAccount, useAppKit } from "@reown/appkit/react";
import { useRouter } from "next/navigation";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const customButtonStyle = `
  .w3m-button {
    background-color: #000000 !important;
    color: #ffffff !important;
    font-weight: bold !important;
    border-radius: 9999px !important;
    padding: 0.75rem 1.5rem !important;
    transition: all 0.3s ease !important;
    border: 2px solid #000000 !important;
  }
  .w3m-button:hover {
    background-color: #ffffff !important;
    color: #000000 !important;
  }
`;

export default function LandingPage() {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const { address, isConnected, caipAddress, status } = useAppKitAccount();
  const { open } = useAppKit();

  useEffect(() => {
    if (isConnected) {
      console.log("Wallet connected: ", address, caipAddress);
      router.push("/dashboard");
    }
  }, [isConnected]);

  const handleGetStarted = async() => {
    open();
  }

  return (
    <div className="flex flex-col min-h-screen bg-white text-black">
      <style>{customButtonStyle}</style>
      <motion.header
        className="px-6 py-8 border-b border-gray-200"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="container mx-auto flex justify-between items-center">
          <Link className="flex items-center justify-center" href="#">
            <Lock className="h-8 w-8 text-black" />
            <span className="ml-2 text-3xl font-bold text-black">
              Mumei
            </span>
          </Link>
          <nav className="hidden md:flex space-x-8">
            <Link
              className="text-lg font-medium hover:text-gray-600 transition-colors"
              href="#features"
            >
              Features
            </Link>
            <Link
              className="text-lg font-medium hover:text-gray-600 transition-colors"
              href="#how-it-works"
            >
              How It Works
            </Link>
            <Link
              className="text-lg font-medium hover:text-gray-600 transition-colors"
              href="#get-started"
            >
              Get Started
            </Link>
          </nav>
          <w3m-button label="Connect Wallet" />
        </div>
      </motion.header>
      <main className="flex-1">
        <section className="py-20 md:py-32 bg-white">
          <motion.div
            className="container mx-auto px-6"
            initial="initial"
            animate="animate"
            variants={stagger}
          >
            <div className="max-w-4xl mx-auto text-center">
              <motion.h1
                className="text-5xl md:text-7xl font-bold mb-6"
                variants={fadeIn}
              >
                Private Feedback for Web3 Companies
              </motion.h1>
              <motion.p
                className="text-xl md:text-2xl text-gray-600 mb-12"
                variants={fadeIn}
              >
                Empower your business with privacy-preserving feedback collection and reward distribution using our innovative SDK.
              </motion.p>
              <motion.div variants={fadeIn}>
                <Button onClick={handleGetStarted} className="text-lg px-8 py-4 rounded-full bg-black text-white hover:bg-white hover:text-black border-2 border-black transition-all duration-300">
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </section>

        <section id="features" className="py-20 bg-gray-100">
          <motion.div
            className="container mx-auto px-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2
              className="text-4xl md:text-5xl font-bold text-center mb-16"
              variants={fadeIn}
            >
              Key Features
            </motion.h2>
            <div className="grid gap-12 md:grid-cols-3">
              {[
                {
                  icon: Shield,
                  title: "Privacy-First Feedback",
                  description:
                    "Collect user feedback without ever disclosing their identity, ensuring complete privacy and anonymity.",
                },
                {
                  icon: Eye,
                  title: "Debiased Insights",
                  description:
                    "Our AI agent provides actionable insights from feedback while maintaining user privacy.",
                },
                {
                  icon: Award,
                  title: "Fair Reward System",
                  description:
                    "Distribute rewards based on feedback usefulness, calculated by our AI in a privacy-preserving manner.",
                },
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  className="text-center"
                  variants={fadeIn}
                >
                  <div className="inline-block p-4 bg-white rounded-full shadow-lg mb-6">
                    <feature.icon className="h-10 w-10 text-black" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </section>

        <section
          id="how-it-works"
          className="w-full py-12 md:py-24 lg:py-32 bg-gray-50"
        >
          <motion.div
            className="container px-4 md:px-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.h2
              className="text-3xl font-bold tracking-tighter sm:text-5xl text-center mb-12 text-black"
              variants={fadeIn}
            >
              How It Works
            </motion.h2>
            <div className="grid gap-6 lg:grid-cols-5 lg:gap-12">
              <motion.div
                className="flex flex-col items-center text-center"
                variants={fadeIn}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                  1
                </div>
                <h3 className="mt-4 text-xl font-bold text-black">
                  User Interaction
                </h3>
                <p className="mt-2 text-gray-600">
                  Users engage with your service or product.
                </p>
              </motion.div>
              <motion.div
                className="flex flex-col items-center text-center"
                variants={fadeIn}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                  2
                </div>
                <h3 className="mt-4 text-xl font-bold text-black">
                  Interaction Attestation
                </h3>
                <p className="mt-2 text-gray-600">
                  Company verifies and attests to the user's interaction.
                </p>
              </motion.div>
              <motion.div
                className="flex flex-col items-center text-center"
                variants={fadeIn}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                  3
                </div>
                <h3 className="mt-4 text-xl font-bold text-black">
                  Feedback Submission
                </h3>
                <p className="mt-2 text-gray-600">
                  User receives an email prompt to submit private feedback.
                </p>
              </motion.div>
              <motion.div
                className="flex flex-col items-center text-center"
                variants={fadeIn}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                  4
                </div>
                <h3 className="mt-4 text-xl font-bold text-black">
                  AI Processing
                </h3>
                <p className="mt-2 text-gray-600">
                  Feedback is processed by our AI for usefulness and reward calculation.
                </p>
              </motion.div>
              <motion.div
                className="flex flex-col items-center text-center"
                variants={fadeIn}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black text-white">
                  5
                </div>
                <h3 className="mt-4 text-xl font-bold text-black">
                  Reward Distribution
                </h3>
                <p className="mt-2 text-gray-600">
                  Rewards are aggregated and distributed privately to users.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </section>

        <section id="get-started" className="py-20 bg-black text-white">
          <motion.div
            className="container mx-auto px-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
          >
            <div className="max-w-3xl mx-auto text-center">
              <motion.h2
                className="text-4xl md:text-5xl font-bold mb-6"
                variants={fadeIn}
              >
                Ready to Revolutionize Your Feedback System?
              </motion.h2>
              <motion.p className="text-xl mb-12" variants={fadeIn}>
                Join the future of private, debiased, and rewarded user feedback. Get started with Mumei today!
              </motion.p>
              <motion.div variants={fadeIn}>
                <Button onClick={handleGetStarted} className="text-lg px-8 py-4 rounded-full bg-white text-black hover:bg-gray-200 transition-all duration-300">
                  Start Now
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </section>
      </main>
      <motion.footer
        className="py-8 bg-white border-t border-gray-200"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <div className="container mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-600 mb-4 md:mb-0">
            © 2024 Mumei. All rights reserved.
          </p>
          <nav className="flex gap-6">
            <Link
              className="text-gray-600 hover:text-black transition-colors"
              href="#"
            >
              Terms of Service
            </Link>
            <Link
              className="text-gray-600 hover:text-black transition-colors"
              href="#"
            >
              Privacy Policy
            </Link>
          </nav>
        </div>
      </motion.footer>
    </div>
  );
}

