// @ts-nocheck

"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useAppKitProvider, useAppKitAccount } from "@reown/appkit/react";
import {
  Wallet,
  Star,
  Send,
  ChevronRight,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { ethers } from 'ethers';
import contractABI from "@/contract/abi.json";
import contractAddress from "@/contract/address.json";
import { pinata } from "@/utils/config";
import { decodeUint32ToString, convertStringToUint32 } from "@/utils/ipfs";

interface ServiceData {
  name: string;
  description: string;
  feedbackQuestions: string[];
}

const domain = {
  name: "PrivateFeedback",
  version: "1",
  chainId: 23295,
  verifyingContract: contractAddress.address,
};

const types = {
  Feedback: [
    { name: "user", type: "address" },
    { name: "serviceId", type: "uint256" },
    { name: "timestamp", type: "uint256" },
    { name: "feedback_p1", type: "uint256" },
    { name: "feedback_p2", type: "uint256" },
  ],
};

export default function MagicLinkFeedback() {
  const [step, setStep] = useState("connect");
  const [serviceData, setServiceData] = useState<ServiceData | null>(null);
  const [ratings, setRatings] = useState<number[]>([]);
  const [overallRating, setOverallRating] = useState(0);
  const [remarks, setRemarks] = useState("");
  const { walletProvider } = useAppKitProvider();
  const { address, isConnected } = useAppKitAccount();
  const params = useParams();

  useEffect(() => {
    if (isConnected) {
      window.ethereum = sapphire.wrap(window.ethereum);
      verifyUser();
    }
  }, [isConnected]);

  useEffect(() => {
    if (serviceData) {
      setRatings(new Array(serviceData.feedbackQuestions.length).fill(0));
    }
  }, [serviceData]);

  const getContract = async () => {
    try {
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await ethersProvider.getSigner();
      const contractRead = new ethers.Contract(
        contractAddress.address,
        contractABI,
        ethersProvider
      );
      const contractWrite = new ethers.Contract(
        contractAddress.address,
        contractABI,
        signer
      )
      return {contractRead, contractWrite};
    } catch (error) {
      toast.error("Failed to fetch contract: " + error.message);
      throw error;
    }
  };

  const fetchService = async () => {
    try {
      const {contractRead, contractWrite} = await getContract();
      const serviceId = BigInt(params.service);
      const serviceMetaData = await contractRead.getServiceMetadata(serviceId);
      const IpfsHash = decodeUint32ToString(
        BigInt(serviceMetaData[0]),
        BigInt(serviceMetaData[1])
      );
      const ipfsUrl = await pinata.gateways.convert(IpfsHash);
      const response = await fetch(ipfsUrl);
      const data = await response.json();
      setServiceData(data);
    } catch (error) {
      toast.error("Failed to fetch service: " + error.message);
    }
  };

  const verifyUser = async () => {
    if (address.toLowerCase() !== params.user.toLowerCase()) {
      toast.error("Please connect with the correct wallet address.");
      return;
    }
    await fetchFeedbackForm();
    setStep("feedback");
  };

  const fetchFeedbackForm = async () => {
    await toast.promise(
      fetchService(),
      {
        loading: 'Loading feedback form...',
        success: 'Feedback form loaded successfully',
        error: 'Failed to load feedback form',
      }
    );
  };

  const handleRatingChange = (index: number, rating: number) => {
    const newRatings = [...ratings];
    newRatings[index] = rating;
    setRatings(newRatings);
  };

  const uploadFeedbackToIPFS = async (feedbackData) => {
    return toast.promise(
      fetch("/api/service", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData),
      }).then(response => response.json()),
      {
        loading: 'Uploading feedback to IPFS...',
        success: 'Feedback uploaded to IPFS successfully',
        error: 'Failed to upload feedback to IPFS',
      }
    );
  };

  interface FeedbackPageProps {
    service: string;
    user: string;
  }

  const signMessage = async (ipfsUrl: string, props: FeedbackPageProps) => {
    let obj = { part1: "", part2: "" };
    convertStringToUint32(ipfsUrl, obj);
    const serviceId = BigInt(params.service);

    try {
      const ethersProvider = new ethers.BrowserProvider(window.ethereum);
      const signer = await ethersProvider.getSigner();
      const {contractRead, contractWrite} = await getContract();
      const timestamp = Math.floor(Date.now() / 1000);

      const feedback = {
        user: signer.address,
        serviceId: serviceId,
        timestamp: timestamp,
        feedback_p1: obj.part1,
        feedback_p2: obj.part2,
      };

      return toast.promise(
        (async () => {
          const signature = await signer.signTypedData(
            domain,
            types,
            feedback
          );
          const splitSig = ethers.Signature.from(signature);
          const tx = await contractWrite.submitFeedback(
            BigInt(serviceId),
            splitSig.v,
            splitSig.r,
            splitSig.s,
            BigInt(timestamp),
            BigInt(obj.part1),
            BigInt(obj.part2)
          );
          await tx.wait();
        })(),
        {
          loading: "Submitting your feedback to the contract...",
          success: "Feedback submitted successfully!",
          error: "Failed to submit feedback to the contract",
        }
      );
    } catch (error) {
      toast.error("Error during submission: " + error.message);
      throw error;
    }
  };

  const handleSubmit = async () => {
    const feedbackData = {
      service: params.service,
      ratings,
      overallRating,
      remarks,
    };

    try {
      const ipfsUrl = await uploadFeedbackToIPFS(feedbackData);
      await signMessage(ipfsUrl);
      setStep("submitted");
    } catch (error) {
      console.error(error);
    }
  };

  const isFormValid = () => {
    return ratings.every((r) => r > 0) && overallRating > 0;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="px-6 py-4 bg-black text-white">
        <div className="container mx-auto flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xl font-bold"
          >
            PrivateFeedback
          </motion.div>
          <w3m-button size="sm" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
          <CardHeader className="bg-gray-50 border-b border-gray-200">
            <CardTitle className="text-2xl font-bold text-gray-800">
              {serviceData ? serviceData.name : "Service Feedback"}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {serviceData ? serviceData.description : "Share your experience"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <AnimatePresence mode="wait">
              {step === "connect" && (
                <motion.div
                  key="connect"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-12"
                >
                  <Wallet className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <h2 className="text-xl font-semibold mb-2 text-gray-800">
                    Connect Your Wallet
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Please connect your wallet to access the feedback form.
                  </p>
                  <div className="flex justify-center">
                    <w3m-button size="md" />
                  </div>
                </motion.div>
              )}
              {step === "feedback" && serviceData && (
                <motion.div
                  key="feedback"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {serviceData.feedbackQuestions.map((question, index) => (
                    <motion.div
                      key={index}
                      className="space-y-3"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                    >
                      <h3 className="font-medium text-gray-700">{question}</h3>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <Button
                            key={rating}
                            variant={ratings[index] === rating ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleRatingChange(index, rating)}
                            className={`flex-1 ${
                              ratings[index] === rating
                                ? "bg-black text-white hover:bg-gray-800"
                                : "border-gray-300 text-gray-700 hover:bg-gray-100"
                            }`}
                          >
                            {rating}
                          </Button>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                  <motion.div
                    className="space-y-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: serviceData.feedbackQuestions.length * 0.1,
                    }}
                  >
                    <h3 className="font-medium text-gray-700">Overall Rating</h3>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Button
                          key={rating}
                          variant={overallRating === rating ? "default" : "outline"}
                          size="sm"
                          onClick={() => setOverallRating(rating)}
                          className={`flex-1 ${
                            overallRating === rating
                              ? "bg-black text-white hover:bg-gray-800"
                              : "border-gray-300 text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              overallRating >= rating ? "fill-current" : ""
                            }`}
                          />
                        </Button>
                      ))}
                    </div>
                  </motion.div>
                  <motion.div
                    className="space-y-3"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: (serviceData.feedbackQuestions.length + 1) * 0.1,
                    }}
                  >
                    <h3 className="font-medium text-gray-700">Additional Remarks</h3>
                    <Textarea
                      placeholder="Any additional comments or suggestions?"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-black focus:border-transparent"
                    />
                  </motion.div>
                </motion.div>
              )}
              {step === "submitted" && (
                <motion.div
                  key="submitted"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-center py-12"
                >
                  <Send className="w-16 h-16 mx-auto text-green-500 mb-4" />
                  <h2 className="text-2xl font-bold mb-2 text-gray-800">Thank You!</h2>
                  <p className="text-gray-600">
                    Your feedback has been submitted successfully.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
          {step === "feedback" && (
            <CardFooter className="bg-gray-50 border-t border-gray-200">
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid()}
                className="w-full bg-black text-white hover:bg-gray-800 disabled:bg-gray-200 disabled:text-gray-400 transition-colors duration-200"
              >
                Submit Feedback
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardFooter>
          )}
        </Card>
      </main>
    </div>
  );
}