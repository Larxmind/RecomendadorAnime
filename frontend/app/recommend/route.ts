// frontend/app/api/recommend/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Apunta directamente a tu IP de AWS por HTTP puro, pasándole los parámetros
  const awsUrl = `http://51.48.145.50:8000/api/v1/recommend?${searchParams.toString()}`;
  
  const res = await fetch(awsUrl);
  const data = await res.json();
  
  return NextResponse.json(data);
}