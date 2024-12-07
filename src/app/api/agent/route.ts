import { NextResponse, NextRequest } from "next/server";
import { main } from "./chatbot";


// Add a listner that checks for POST req with this type of given data

// { ServiceId: ...,
//   UserId: ...,
//   StarReview: ...,
//   Review: ...,
//   QuestionResponse: [{Question: "How much you liked the product?", Response: 1 (out of 5)},...] (basically an array of objects)
// }

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    console.log(data);
    const review = data.Review;
    const r = await main(review);

    // // This triggers the function from chatbot
    // if (r) {
    //   return NextResponse.json({ response: r }, { status: 200 });
    // }
    return NextResponse.json(data, { status: 200 });
  } catch (e) {
    console.log(e);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
  
}