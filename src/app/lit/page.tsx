"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
// import { encryptString } from "./lit";
import { LitNodeClient } from "@lit-protocol/lit-node-client";
import { encryptString, decryptString } from '@lit-protocol/encryption';

export default function StringInputPage() {
  const [inputText, setInputText] = useState('');
  const [processedText, setProcessedText] = useState('');

  const encryptStringToCipher = async (text: string) => {
    console.log("text:", text);
    const chain = 'baseSepolia';
    const accessControlConditions = [
       {
         contractAddress: '',
         standardContractType: '',
         chain,
         method: 'eth_getBalance',
         parameters: [':userAddress', 'latest'],
         returnValueTest: {
           comparator: '>=',
           value: '0',
         },
       },
     ];
     const client = new LitNodeClient({
       litNetwork: "datil-dev"
     });
     await client.connect();
     const { ciphertext, dataToEncryptHash } = await encryptString(
       {
         accessControlConditions,
         sessionSigs: {}, // your session
         chain,
         dataToEncrypt: text,
       },
       client
     );
   
     console.log("cipher text:", ciphertext, "hash:", dataToEncryptHash);
  }
  
  const handleProcessString = () => {
    // Simple processing - could be modified as needed
    console.log(inputText);
    encryptStringToCipher(inputText);
    setProcessedText(inputText.trim().toUpperCase());
  };

  return (
    <div className="container mx-auto p-4 max-w-md">
      <Card>
        <CardHeader>
          <CardTitle>String Input Processor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Input 
              placeholder="Enter a string" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full"
            />
            <Button 
              onClick={handleProcessString}
              className="w-full"
            >
              Process String
            </Button>
            {processedText && (
              <div className="mt-4 p-3 bg-gray-100 rounded">
                <p className="font-medium">Processed Result:</p>
                <p>{processedText}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}